export const DeviceStatus = () => {
  return (
    <div id="device-status" className="grid grid-cols-3 gap-2">
      <div className="bg-gray-800 p-3 rounded-lg text-center">
        <p className="text-xs text-gray-400">Bekleyen</p>
        <p className="text-lg font-bold text-yellow-500">5</p>
      </div>
      <div className="bg-gray-800 p-3 rounded-lg text-center">
        <p className="text-xs text-gray-400">Onarımda</p>
        <p className="text-lg font-bold text-blue-500">4</p>
      </div>
      <div className="bg-gray-800 p-3 rounded-lg text-center">
        <p className="text-xs text-gray-400">Hazır</p>
        <p className="text-lg font-bold text-green-500">3</p>
      </div>
    </div>
  );
};
