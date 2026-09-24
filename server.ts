import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { WebSocketServer } from 'ws';

dotenv.config();

const app = express();
const PORT = 3000;
const aiRequestCounts = new Map<string, { count: number; resetAt: number }>();

app.disable('x-powered-by');
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const key = String(req.ip || 'unknown');
  const now = Date.now();
  const bucket = aiRequestCounts.get(key) || { count: 0, resetAt: now + 60000 };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + 60000;
  }

  if (bucket.count >= 60) {
    return res.status(429).json({ error: 'Too many requests. Please retry later.' });
  }

  bucket.count += 1;
  aiRequestCounts.set(key, bucket);
  next();
});

function requireAiAccess(req: any, res: any, next: any) {
  const requiredToken = process.env.AI_ACCESS_TOKEN;
  if (!requiredToken) {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const providedToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (providedToken !== requiredToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

app.use('/api/gemini', requireAiAccess);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Lazy GoogleGenAI client with User-Agent header as mandated by skill
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// Resilient Model Executor with Automatic Fallback for 503 / High Demand
async function generateContentWithResilience(params: {
  primaryModel: string;
  contents: any;
  config?: any;
}) {
  const ai = getAi();
  const { primaryModel, contents, config } = params;

  const candidateModels = [
    primaryModel,
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest'
  ].filter((m, idx, arr) => arr.indexOf(m) === idx);

  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config
      });

      return {
        response,
        usedModel: model,
        isFallback: model !== primaryModel
      };
    } catch (err: any) {
      lastError = err;
      const errStr = String(err?.message || err);
      const isTemporaryDemandOrUnavailable =
        errStr.includes('503') ||
        errStr.includes('high demand') ||
        errStr.includes('UNAVAILABLE') ||
        errStr.includes('429') ||
        errStr.includes('RESOURCE_EXHAUSTED') ||
        errStr.includes('try again later');

      if (isTemporaryDemandOrUnavailable && i < candidateModels.length - 1) {
        console.warn(`[Gemini Resilience] ${model} yoğun talep nedeniyle meşgul. Sıradaki model deneniyor: ${candidateModels[i + 1]}`);
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }

      break;
    }
  }

  throw lastError;
}

// Product label OCR: image bytes stay server-side and are converted to compact text only.
app.post('/api/gemini/product-ocr', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Ürün etiketi görüntüsü gereklidir.' });
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      return res.status(400).json({ error: 'Desteklenmeyen görüntü biçimi.' });
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
    if (cleanBase64.length > 8_000_000) {
      return res.status(413).json({ error: 'Görüntü çok büyük. Daha yakın bir etiket fotoğrafı çekin.' });
    }

    const result = await generateContentWithResilience({
      primaryModel: 'gemini-3.5-flash',
      contents: [{
        role: 'user',
        parts: [
          { text: 'Bu telefon/aksesuar kutusu veya ürün etiketindeki okunabilir ürün tanımlama metnini çıkar. Marka, model, kapasite, renk, parça türü ve ürün koduna öncelik ver. Tahmin etme. Yalnızca görüntüde açıkça görülen kısa metni düz metin olarak döndür.' },
          { inlineData: { mimeType, data: cleanBase64 } }
        ]
      }],
      config: { temperature: 0 }
    });

    res.json({ text: (result.response.text || '').trim(), model: result.usedModel });
  } catch (err: any) {
    console.error('Product OCR error:', err);
    res.status(500).json({ error: err.message || 'Ürün etiketi okunamadı.' });
  }
});

// 1. Multi-turn Gemini Chatbot with Role-Based System Instructions
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const {
      messages,
      model = 'gemini-3.5-flash',
      systemInstruction,
      role = 'technician'
    } = req.body;

    let defaultRoleInstruction = systemInstruction;
    if (!defaultRoleInstruction) {
      switch (role) {
        case 'parts':
          defaultRoleInstruction =
            'Sen "Osman Teknik Pro" dükkanının Yedek Parça ve Tedarik Danışmanısın. ' +
            'Ekran türleri (OLED, Orijinal Servis Paketi, Revize, Incell), batarya hücreleri, kasa, kamera camları ve mikro lehimleme sarf malzemeleri konusunda uzmansın. ' +
            'Teknisyenlere ve yöneticilere toptancı piyasası, kalite sınıflandırması ve tavsiye edilen satış kâr marjlarını samimi ve net dille açıkla.';
          break;
        case 'valuation':
          defaultRoleInstruction =
            'Sen "Osman Teknik Pro" İkinci El ve Sıfır Cep Telefonu Ekspertiz & Değerleme Uzmanısın. ' +
            'Kozmetik durum notlandırma (A+, A, B, C), batarya sağlığı yüzdesi, orijinal/değişen parça analizi ve Türkiye 2. el piyasa fiyatlandırması yaparsın. ' +
            'Dükkanın alım fiyatı, dükkanda satılacak fiyat ve kâr marjını net tablolarsın.';
          break;
        case 'customer':
          defaultRoleInstruction =
            'Sen "Osman Teknik Pro" Müşteri Kabul, Fiyat Teklifi ve Garanti Danışmanısın. ' +
            'Teknik detayları müşterinin anlayabileceği nazik, kurumsal ve şeffaf bir dille anlatırsın. ' +
            'Tamir süresi, veri güvenliği taahhüdü, parça garanti şartları ve risk onay metinleri hazırlarsın.';
          break;
        case 'technician':
        default:
          defaultRoleInstruction =
            'Sen "Osman Teknik Pro" cep telefonu teknik servis ve hızlı satış dükkanının deneyimli Baş Teknisyeni ve Atölye Ustasısın. ' +
            'Teknisyenlere ve çıraklara arıza tespiti, anakart lehimleme, entegre değişimi (PMIC, U2 Tristar/Hydra, Baseband, Audio IC), ' +
            'kısa devre tespiti (multimetre diyot modu, termal kamera), ekran revizyonu ve batarya kalibrasyonunda usta diliyle rehberlik et. ' +
            'Cihaz marka/modellerinin kronik arızalarını iyi bilirsin. Statik elektrik ve güvenlik uyarılarını her zaman hatırlat.';
          break;
      }
    }

    const contents = (messages || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text || m.content || '' }]
    }));

    const result = await generateContentWithResilience({
      primaryModel: model || 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction: defaultRoleInstruction,
        temperature: 0.7
      }
    });

    res.json({
      text: result.response.text,
      model: result.usedModel,
      isFallback: result.isFallback
    });
  } catch (err: any) {
    console.error('Gemini chat error:', err);
    res.status(500).json({
      error: err.message || 'Gemini sohbet yanıtı oluşturulamadı.'
    });
  }
});

app.post('/api/gemini/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Sorgu metni gereklidir.' });
    }

    const prompt =
      `Türkiye telefon teknik servis ve parça piyasası bağlamında güncel bilgileri Google Arama ile araştır: ${query}. ` +
      `Özellikle toptancı fiyat aralıkları, parça kalite seçenekleri (Orijinal, Revize, Yan Sanayi) ve dükkan için tavsiye edilen müşteri tamir/satış fiyatını açıkça belirt.`;

    const ai = getAi();
    let result: any;
    try {
      result = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
    } catch (groundingErr: any) {
      console.warn('Google Search tool limit reached, falling back to synthesis:', groundingErr?.message);
      const fallback = await generateContentWithResilience({
        primaryModel: 'gemini-3.5-flash',
        contents: prompt + ' (Türkiye cep telefonu teknik servis ve toptancı piyasası tecrübene göre detaylandır)',
        config: {}
      });
      result = fallback.response;
    }

    const searchChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = searchChunks
      .map((chunk: any) => ({
        title: chunk.web?.title || 'Web Kaynağı',
        url: chunk.web?.uri || ''
      }))
      .filter((s: any) => s.url);

    res.json({
      text: result.text,
      sources: webSources,
      model: 'gemini-3.5-flash'
    });
  } catch (err: any) {
    console.error('Gemini search grounding error:', err);
    res.status(500).json({
      error: err.message || 'Google Arama destekli sorgulama başarısız oldu.'
    });
  }
});

app.post('/api/gemini/maps', async (req, res) => {
  try {
    const { query, location = 'Kadıköy, İstanbul', latLng } = req.body;

    const prompt =
      `Konum: ${location}. ` +
      `Soru: ${query || 'En yakın telefon yedek parça toptancıları, ekran ithalatçıları ve lehim/ekipman dükkanları nerede?'}. ` +
      `Lütfen toptancıların adreslerini, konum bilgilerini, açık olma durumlarını ve güvenilirlik ipuçlarını açıkla.`;

    const ai = getAi();
    let result: any;
    try {
      const config: any = {
        tools: [{ googleMaps: {} }]
      };

      if (latLng && typeof latLng.latitude === 'number' && typeof latLng.longitude === 'number') {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: latLng.latitude,
              longitude: latLng.longitude
            }
          }
        };
      }

      result = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config
      });
    } catch (mapsErr: any) {
      console.warn('Google Maps tool limit reached, falling back to expert supplier database knowledge:', mapsErr?.message);
      const fallback = await generateContentWithResilience({
        primaryModel: 'gemini-3.5-flash',
        contents: prompt + ' (Bölgedeki bilinen toptancılar çarşısı, pasajlar ve yedek parçacılar hakkında rehberlik et)',
        config: {}
      });
      result = fallback.response;
    }

    const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const mapsSources = chunks
      .map((chunk: any) => {
        if (chunk.maps) {
          return {
            title: chunk.maps.title || 'Google Harita Konumu',
            uri: chunk.maps.uri || '',
            placeId: chunk.maps.placeId || '',
            snippets: chunk.maps.placeAnswerSources?.reviewSnippets || []
          };
        }
        if (chunk.web) {
          return {
            title: chunk.web.title || 'Web Kaynağı',
            uri: chunk.web.uri || '',
            snippets: []
          };
        }
        return null;
      })
      .filter((s: any) => s && s.uri);

    res.json({
      text: result.text,
      sources: mapsSources,
      model: 'gemini-3.5-flash'
    });
  } catch (err: any) {
    console.error('Gemini maps grounding error:', err);
    res.status(500).json({
      error: err.message || 'Google Haritalar destekli toptancı araması başarısız oldu.'
    });
  }
});

app.post('/api/gemini/diagnose', async (req, res) => {
  try {
    const { deviceModel, faultDescription } = req.body;

    const prompt =
      `Cihaz: ${deviceModel}\nŞikayet / Arıza: ${faultDescription}\n\n` +
      `Bir teknik servis ustası olarak bu cihaz için JSON formatında arıza analizini hazırla:\n` +
      `1. Muhtemel arıza kök nedeni (rootCause)\n` +
      `2. Kontrol edilmesi gereken entegre/parçalar (suspectedParts: string[])\n` +
      `3. Tahmini tamir süresi saat/dakika (estimatedTime)\n` +
      `4. Tahmini yedek parça maliyeti TL (estimatedPartCostTl: number)\n` +
      `5. Müşteriye tavsiye edilen anahtar teslim onarım fiyatı TL (recommendedSalePriceTl: number)\n` +
      `6. Teknisyen için kritik güvenlik veya anakart uyarısı (technicianNote)\n\n` +
      `Yalnızca geçerli JSON döndür.`;

    const result = await generateContentWithResilience({
      primaryModel: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    let data = {};
    try {
      data = JSON.parse(result.response.text || '{}');
    } catch {
      data = { rawText: result.response.text };
    }

    res.json({ diagnosis: data, model: result.usedModel });
  } catch (err: any) {
    console.error('Gemini diagnose error:', err);
    res.status(500).json({
      error: err.message || 'Arıza teşhisi yapılamadı.'
    });
  }
});

app.post('/api/gemini/live-voice', async (req, res) => {
  try {
    const { transcript, history = [] } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'Sesli konuşma metni gereklidir.' });
    }

    const systemInstruction =
      'Sen "Osman Teknik Pro" akıllı cep telefonu teknik servis ve dükkan yönetim yazılımının eller serbest canlı sesli asistanısın. ' +
      'Atölye ustasıyla veya teknisyenle Türkçe konuşuyorsun. Kısa, samimi, pratik ve teknik açıdan isabetli cevaplar ver. ' +
      'Anakart lehimleme, entegreler (PMIC, Tristar, Baseband), ekran ve batarya revizyonu, toptancı parça fiyatları ve dükkan yönetimi konularında uzmansın. ' +
      'Usta sesli olarak sorduğunda veya elleri lehim makinesindeyken hızlıca rehberlik et.';

    const contents = (history || []).map((h: any) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text || '' }]
    }));
    contents.push({
      role: 'user',
      parts: [{ text: transcript }]
    });

    let result: any;
    try {
      result = await generateContentWithResilience({
        primaryModel: 'gemini-3.1-flash-live-preview',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });
    } catch (liveErr: any) {
      console.warn('gemini-3.1-flash-live-preview turn fallback to gemini-3.5-flash:', liveErr?.message);
      result = await generateContentWithResilience({
        primaryModel: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });
    }

    res.json({
      text: result.response.text,
      model: result.usedModel,
      isFallback: result.isFallback
    });
  } catch (err: any) {
    console.error('Gemini live-voice error:', err);
    res.status(500).json({
      error: err.message || 'Canlı ses asistanı yanıtı alınamadı.'
    });
  }
});

app.post('/api/gemini/voice-control', async (req, res) => {
  try {
    const { transcript, currentTab, contextSummary } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'Sesli komut metni gereklidir.' });
    }

    const systemPrompt =
      `Sen "Osman Teknik Pro" telefon teknik servis ve dükkan yönetim yazılımının Akıllı Sesli Asistanısın. ` +
      `Kullanıcı atölye ustası veya yöneticisidir. Mikrofonla söylediği Türkçe metni analiz et ve uygulamayı kontrol eden bir eylem (action) üret.\n\n` +
      `Sistemdeki mevcut ekranlar (targetTab):\n` +
      `- "servis": Teknik servis, tamir kayıtları, cihaz kabul listesi\n` +
      `- "satis": Hızlı satış, barkodlu POS, kasa satışı, sepet\n` +
      `- "stok": Stok yönetimi, yedek parçalar, ekran/batarya stokları\n` +
      `- "cari": Müşteriler, veresiye hesaplar, borç/alacak takibi\n` +
      `- "kasa": Kasa hareketleri, nakit/kart kasası, gün sonu raporu\n` +
      `- "telefon": İkinci el telefon alım/satım, ekspertiz\n` +
      `- "teknisyen": Teknisyen tamir ve iş tamamlama performans raporu\n` +
      `- "takip": Müşteri karekod canlı cihaz takip ekranı\n` +
      `- "dashboard": Ana sayfa, genel özet, ciro grafikleri\n` +
      `- "ai": AI Atölye Danışmanı, şema ve arıza analiz ekranı\n` +
      `- "temalar": Arayüz tema seçenekleri\n` +
      `- "ayarlar": Sistem, termal yazıcı ve fiş ayarları\n\n` +
      `Açılabilir Modallar (modalName):\n` +
      `- "service_intake": Yeni servis cihaz kabul fişi aç\n` +
      `- "cloud_sync": Firebase bulut senkronizasyon penceresi\n` +
      `- "usd_calc": Canlı dolar çevirici ve hesap makinesi\n` +
      `- "technician": Teknisyen performans penceresi\n\n` +
      `Uygulama Anlık Durumu: ${JSON.stringify(contextSummary || {})}\n` +
      `Aktif Sekme: ${currentTab || 'dashboard'}\n\n` +
      `Çıktıyı kesinlikle geçerli JSON formatında ver:\n` +
      `{\n` +
      `  "action": "NAVIGATE" | "OPEN_MODAL" | "ADD_CART" | "SEARCH" | "CHANGE_THEME" | "STATS_QUERY" | "TECH_ADVICE",\n` +
      `  "targetTab": "servis" | "satis" | "stok" | "cari" | "kasa" | "telefon" | "teknisyen" | "takip" | "dashboard" | "ai" | "ayarlar" | null,\n` +
      `  "modalName": "service_intake" | "cloud_sync" | "usd_calc" | "technician" | null,\n` +
      `  "searchQuery": string | null,\n` +
      `  "cartItem": { "name": string, "price": number } | null,\n` +
      `  "themeName": "default-dark" | "light-card" | "colorful-minimal" | null,\n` +
      `  "spokenResponse": "Kullanıcıya Türkçe seslendirilecek samimi ve profesyonel usta cevabı.",\n` +
      `  "displayText": "Ekranda gösterilecek kısa durum özeti"\n` +
      `}`;

    const result = await generateContentWithResilience({
      primaryModel: 'gemini-3.5-flash',
      contents: `Kullanıcı Sesli Komutu: "${transcript}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    let commandData = {};
    try {
      commandData = JSON.parse(result.response.text || '{}');
    } catch {
      commandData = {
        action: 'TECH_ADVICE',
        spokenResponse: result.response.text,
        displayText: transcript
      };
    }

    res.json({
      success: true,
      command: commandData,
      model: result.usedModel
    });
  } catch (err: any) {
    console.error('Gemini voice-control error:', err);
    res.status(500).json({
      error: err.message || 'Sesli komut işlenemedi.'
    });
  }
});

app.post('/api/gemini/parse-service-intake', async (req, res) => {
  try {
    const { speechText } = req.body;
    if (!speechText) {
      return res.status(400).json({ error: 'Ses metni gereklidir.' });
    }

    const systemPrompt =
      `Sen bir telefon teknik servis yazılımının otomatik form doldurma asistanısın. ` +
      `Usta cihazı teslim alırken sesli olarak müşteri ve cihaz bilgilerini söylemiştir. ` +
      `Bu metinden servis kayıt alanlarını çıkar ve kesinlikle geçerli JSON formatında döndür.\n\n` +
      `JSON Şeması:\n` +
      `{\n` +
      `  "customerName": string (örn: "Ahmet Yılmaz"),\n` +
      `  "customerPhone": string (örn: "0532 123 45 67"),\n` +
      `  "deviceBrand": "Apple" | "Samsung" | "Xiaomi" | "Huawei" | "Oppo" | "Vivo" | "Realme" | "Diğer",\n` +
      `  "deviceModel": string (örn: "iPhone 11", "Redmi Note 12", "Galaxy S23"),\n` +
      `  "imei": string (15 haneli rakam varsa, yoksa boş string ""),\n` +
      `  "issueComplaint": string (şikayet ve arıza özeti),\n` +
      `  "cosmeticCondition": string (kasa, ekran durumu veya çizikler),\n` +
      `  "accessories": string[] (örn: ["Kılıf", "Şarj Aleti"]),\n` +
      `  "estimatedPrice": number (tahmini fiyat rakamı),\n` +
      `  "lockCode": string (varsa şifre veya pin),\n` +
      `  "damageTags": string[] (örn: ["Ön Cam Çatlak", "Kasa Ezik", "Kamera Çizik"]),\n` +
      `  "summary": string (Usta için Türkçe kısa özet)\n` +
      `}`;

    const result = await generateContentWithResilience({
      primaryModel: 'gemini-3.5-flash',
      contents: `Ustanın söylediği servis bilgileri: "${speechText}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    let parsedData = {};
    try {
      parsedData = JSON.parse(result.response.text || '{}');
    } catch {
      parsedData = {
        customerName: '',
        customerPhone: '',
        deviceBrand: 'Apple',
        deviceModel: '',
        issueComplaint: speechText,
        estimatedPrice: 0,
        summary: speechText
      };
    }

    res.json({
      success: true,
      data: parsedData,
      model: result.usedModel
    });
  } catch (err: any) {
    console.error('Parse service intake error:', err);
    res.status(500).json({
      error: err.message || 'Ses ayrıştırma başarısız oldu.'
    });
  }
});

async function startServer() {
  const server = http.createServer(app);

  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', async (clientWs) => {
    console.log('[Live API WS] İstemci /live WebSocket bağlantısı kurdu');
    let session: any = null;

    try {
      const ai = getAi();
      session = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction:
            'Sen "Osman Teknik Pro" cep telefonu teknik servis ve dükkan yönetim yazılımının eller serbest canlı sesli asistanısın. ' +
            'Atölye ustasıyla veya teknisyenle Türkçe konuşuyorsun. Kısa, teknik ve pratik usta diliyle samimi cevaplar ver. ' +
            'Arıza tespiti, entegre kodları, toptancı parça fiyatları ve dükkan yönetimi konularında uzmansın.'
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (audio) {
              clientWs.send(JSON.stringify({ audio, text }));
            } else if (text) {
              clientWs.send(JSON.stringify({ text }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.send(JSON.stringify({ type: 'closed' }));
            }
          },
          onerror: (err) => {
            console.error('[Live API WS] Gemini oturum hatası:', err);
            if (clientWs.readyState === clientWs.OPEN) {
              clientWs.send(JSON.stringify({ error: err?.message || 'Canlı ses hatası' }));
            }
          }
        }
      });

      clientWs.on('message', (rawData) => {
        try {
          const payload = JSON.parse(rawData.toString());
          if (payload.audio && session) {
            session.sendRealtimeInput({
              audio: { data: payload.audio, mimeType: 'audio/pcm;rate=16000' }
            });
          } else if (payload.text && session) {
            session.sendRealtimeInput({
              text: payload.text
            });
          }
        } catch (err) {
          console.error('[Live API WS] Mesaj ayrıştırma hatası:', err);
        }
      });

      clientWs.on('close', () => {
        try {
          if (session) session.close();
        } catch (e) {}
      });
    } catch (err: any) {
      console.error('[Live API WS] Başlatma hatası:', err);
      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(JSON.stringify({ error: err?.message || 'Live API oturumu başlatılamadı' }));
        clientWs.close();
      }
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Osman Teknik Pro Sunucusu http://0.0.0.0:${PORT} üzerinde çalışıyor (WebSocket /live aktif)`);
  });
}

startServer();
