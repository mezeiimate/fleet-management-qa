import React from 'react';

function Dashboard({ userRole, userName, onLogout, onNavigate }) {
  const isAdmin = userRole === 'admin';
  const isSupport = userRole === 'support';

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Navigációs sáv */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg text-xl">🚛</div>
          <span className="font-black text-xl tracking-tighter italic text-slate-800">
            FLEET<span className="text-blue-600">CORE</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Bejelentkezve</p>
            <p className="font-bold text-sm text-slate-700">{userName}</p>
          </div>
          <button 
            onClick={onLogout}
            className="bg-slate-100 hover:bg-red-50 hover:text-red-600 px-4 py-2 rounded-xl font-bold text-xs transition-all"
          >
            KIJELENTKEZÉS
          </button>
        </div>
      </nav>

      {/* Tartalom */}
      <main className="max-w-7xl mx-auto p-8">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">
            Üdvözöljük, <span className="text-blue-600">{userName}!</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2">Válasszon az alábbi modulok közül a flotta kezeléséhez.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(isAdmin || isSupport) && (
            <>
              <MenuCard 
                title="Járműpark" 
                desc="A teljes flotta áttekintése, autók szerkesztése és állapotkövetés." 
                icon="🚗" 
                color="blue"
                onClick={() => onNavigate('vehicles')} 
              />
              <MenuCard 
                title="Szerviz naptár" 
                desc="Beérkezett hibajelentések és javítások menedzselése." 
                icon="🔧" 
                color="red"
                onClick={() => onNavigate('service')} 
              />
            </>
          )}

          {isAdmin && (
            <MenuCard 
              title="Felhasználók" 
              desc="Munkatársak, sofőrök és rendszerjogosultságok kezelése." 
              icon="👥" 
              color="indigo"
              onClick={() => onNavigate('users')} 
            />
          )}

          {userRole === 'driver' && (
            <MenuCard 
              title="Saját autóm" 
              desc="Hozzárendelt jármű adatai és gyors hibajelentés." 
              icon="🔑" 
              color="green"
              onClick={() => onNavigate('my-car')} 
            />
          )}
        </div>
      </main>
    </div>
  );
}

function MenuCard({ title, desc, icon, color, onClick }) {
  const colors = {
    blue: "border-blue-500 text-blue-600 bg-blue-50",
    red: "border-red-500 text-red-600 bg-red-50",
    indigo: "border-indigo-500 text-indigo-600 bg-indigo-50",
    green: "border-green-500 text-green-600 bg-green-50"
  };

  return (
    <button 
      onClick={onClick}
      className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col h-full group"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 border-b-4 ${colors[color]}`}>
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm font-medium leading-relaxed flex-grow">{desc}</p>
      <div className="mt-6 flex items-center text-blue-600 font-bold text-xs uppercase tracking-widest group-hover:gap-2 transition-all">
        Megnyitás <span className="opacity-0 group-hover:opacity-100 transition-all">→</span>
      </div>
    </button>
  );
}

export default Dashboard;