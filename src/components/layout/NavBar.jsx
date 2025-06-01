// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=0-38&t=iSeOx5vBGiOUayMu-4


import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function NavBar({ navItems }) {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-stone-50 shadow-lg border-t border-slate-600/10 flex justify-center px-0 py-3 z-50" style={{ borderRadius: 0 }}>
      <div className="flex flex-row w-full max-w-xl mx-auto justify-center" style={{ gap: "20pt" }}>
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center text-slate-500 font-semibold transition-colors duration-150 ${location.pathname === item.to ? "text-slate-600" : "text-slate-500"}`}
          >
            {item.icon}
            <span className="mt-1 text-base">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
} 