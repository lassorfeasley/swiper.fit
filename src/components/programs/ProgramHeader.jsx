import React from "react";
import { MdArrowBack, MdAdd } from "react-icons/md";

export default function AppHeader({ title, onBack, onAdd }) {
  return (
    <header
      style={{
        display: "flex",
        width: 430,
        padding: "40px 20px 20px 20px",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 10,
        borderBottom: "0.5px solid #2F3640",
        background: "#FFF",
      }}
    >
      {/* Back arrow row */}
      <div style={{ width: "100%", display: "flex", justifyContent: "flex-start" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <MdArrowBack size={32} color="#2F3640" />
        </button>
      </div>
      {/* Program name and plus icon row */}
      <div style={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <span style={{ fontWeight: 700, fontSize: 32, lineHeight: 1 }}>{title}</span>
        <button onClick={onAdd} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <MdAdd size={32} color="#2F3640" />
        </button>
      </div>
    </header>
  );
} 