export const RecentTransactions = () => {
  const transactions = [
    { id: 1, title: 'iPhone 13 - Ekran değişimi', status: 'Kabul', time: '09:12' },
    { id: 2, title: 'Samsung A54 - Satış', status: 'Tamamlandı', time: '08:47' },
    { id: 3, title: 'iPhone 12 - Alım', status: 'Stokta', time: '08:21' },
  ];

  return (
    <div id="recent-transactions" className="bg-gray-800 p-4 rounded-xl">
      <h3 className="font-semibold mb-3">Son İşlemler</h3>
      <div className="space-y-3">
        {transactions.map(t => (
          <div key={t.id} className="flex justify-between items-center text-sm border-b border-gray-700 pb-2">
            <span>{t.title}</span>
            <div className="flex gap-2 items-center">
              <span className={`px-2 py-0.5 rounded text-xs ${t.status === 'Kabul' ? 'bg-blue-900' : 'bg-green-900'}`}>{t.status}</span>
              <span className="text-gray-400">{t.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
