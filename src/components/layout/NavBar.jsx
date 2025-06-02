// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=0-38&t=iSeOx5vBGiOUayMu-4


import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function NavBar({ navItems }) {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t-[0.25px] border-slate-500 flex justify-between items-start px-6 py-3 z-50" style={{ borderRadius: 0, height: '7rem' }}>
      <div style={{ flex: 1, maxWidth: 350, justifyContent: 'space-between', alignItems: 'center', display: 'flex', margin: '0 auto', width: '100%' }}>
        {navItems.map((item) => {
          const selected = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`w-14 inline-flex flex-col justify-start items-center gap-1 group`}
              aria-current={selected ? 'page' : undefined}
            >
              <div className={`size-7 relative overflow-hidden flex items-center justify-center`}>
                {React.cloneElement(item.icon, {
                  className: `size-6 absolute left-[3px] top-[3px] ${selected ? 'text-zinc-700' : 'text-slate-200'}`
                })}
              </div>
              <div className={`text-center text-xs font-bold font-['Space_Grotesk'] leading-3 ${selected ? 'text-slate-600' : 'text-slate-200'}`}>
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
} 