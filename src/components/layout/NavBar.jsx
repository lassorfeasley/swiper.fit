// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=0-38&t=iSeOx5vBGiOUayMu-4


import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function NavBar({ navItems }) {
  const location = useLocation();
  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-lg px-8 py-4 flex space-x-12 z-50">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`flex flex-col items-center text-gray-700 font-semibold transition-colors duration-150 ${location.pathname === item.to ? "text-black" : "text-gray-700"}`}
        >
          {item.icon}
          <span className="mt-1 text-base">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
} 