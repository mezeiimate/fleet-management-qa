import { useEffect, useState } from 'react';
import axios from 'axios';

function ServiceBoard({ onBack }) {
  const [reports, setReports] = useState([]);

  const fetchReports = () => {
    axios.get('http://localhost:5000/api/reports').then(res => setReports(res.data));
  };

  useEffect(() => { fetchReports(); }, []);

  const updateStatus = (id, newStatus) => {
    axios.patch(`http://localhost:5000/api/reports/${id}`, { status: newStatus })
      .then(() => fetchReports());
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 text-blue-600 font-bold">← Dashboard</button>
        <h1 className="text-3xl font-black mb-8 text-gray-800">SZERVIZ ÉS HIBAJEGYEK</h1>

        <div className="space-y-4">
          {reports.length === 0 ? <p className="text-gray-400">Nincs aktív hibajelentés.</p> : 
          reports.map(r => (
            <div key={r.id} className={`bg-white p-6 rounded-2xl shadow-sm border-l-8 ${r.status === 'Pending' ? 'border-red-500' : 'border-green-500'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-xl text-gray-800">{r.license_plate} - {r.brand} {r.model}</h3>
                  <p className="text-gray-600 mt-2 p-3 bg-gray-50 rounded-lg italic">"{r.description}"</p>
                  <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold">Beküldve: {new Date(r.created_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black text-center ${r.status === 'Pending' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {r.status.toUpperCase()}
                  </span>
                  {r.status === 'Pending' && (
                    <button onClick={() => updateStatus(r.id, 'Resolved')} className="bg-gray-800 text-white text-[10px] px-3 py-2 rounded-lg font-bold">LEZÁRÁS</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ServiceBoard;