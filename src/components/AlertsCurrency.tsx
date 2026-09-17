import { AlertTriangle, DollarSign } from 'lucide-react';

export const AlertsCurrency = () => {
  return (
    <div id="alerts-currency" className="grid grid-cols-2 gap-4">
      <div className="bg-gray-800 p-4 rounded-xl flex items-center gap-3">
        <AlertTriangle className="text-red-500" size={24} />
        <div>
          <p className="text-xs text-gray-400">Kritik Stok</p>
          <p className="text-sm font-semibold">3 Ürün</p>
        </div>
      </div>
      <div className="bg-gray-800 p-4 rounded-xl flex items-center gap-3">
        <DollarSign className="text-green-500" size={24} />
        <div>
          <p className="text-xs text-gray-400">USD Kur</p>
          <p className="text-sm font-semibold">34.12 ₺</p>
        </div>
      </div>
    </div>
  );
};
