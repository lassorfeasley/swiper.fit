import React from "react";

export default function Footer() {
  // Detect Safari for specific fixes
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  return (
    <div 
      className="w-full h-36 px-3 pt-3 pb-24 bg-stone-100 border-t border-neutral-neutral-300 inline-flex flex-col justify-start items-start gap-3"
      style={{
        // Safari-specific positioning fix
        ...(isSafari && {
          position: 'relative',
          bottom: 0,
          width: '100%'
        })
      }}
    >
      <div className="self-stretch min-w-36 justify-start text-neutral-neutral-500 text-xs font-bold font-['Be_Vietnam_Pro'] leading-none">Developed by Lassor</div>
      <div className="self-stretch flex flex-col justify-start items-start gap-1">
        <a href="https://www.Lassor.com" target="_blank" rel="noopener noreferrer" className="self-stretch justify-start text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none no-underline">www.Lassor.com</a>
        <a href="mailto:Feasley@Lassor.com" className="w-56 justify-start text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none no-underline">Feasley@Lassor.com</a>
      </div>
    </div>
  );
}
