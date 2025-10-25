import React from "react";
import { useNavigate } from "react-router-dom";
import { MoveUpRight } from "lucide-react";

interface LoggedOutNavProps {
  showAuthButtons?: boolean;
}

export default function LoggedOutNav({ showAuthButtons = true }: LoggedOutNavProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Layout - Only visible on mobile breakpoints */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 w-full flex-shrink-0 bg-white logged-out-nav">
        {showAuthButtons && (
          <div className="w-full h-11 border-b border-neutral-neutral-300 flex items-center">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Force navigation with window.location.href
                window.location.href = '/login';
              }}
              className="w-1/2 h-11 border-r border-neutral-neutral-300 flex justify-center items-center gap-2 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <div className="justify-start text-neutral-neutral-700 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">Log in</div>
              <MoveUpRight className="w-5 h-5 text-neutral-neutral-700" />
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Force navigation with window.location.href
                window.location.href = '/create-account';
              }}
              className="w-1/2 h-11 bg-green-600 flex justify-center items-center gap-2 hover:bg-green-700 transition-colors cursor-pointer"
            >
              <div className="justify-start text-white text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">Create account</div>
              <MoveUpRight className="w-5 h-5 text-white" />
            </button>
          </div>
        )}
        <div className="w-full h-11 pl-5 border-b border-neutral-neutral-300 inline-flex justify-between items-center">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate('/');
            }}
            className="w-28 inline-flex flex-col justify-start items-start gap-2.5 cursor-pointer p-1 rounded"
          >
            <img 
              src="/images/swiper-logo.png" 
              alt="Swiper Logo" 
              className="w-28 h-auto object-contain"
            />
          </button>
        </div>
      </div>

      {/* Desktop Layout - Hidden on mobile, visible on md+ breakpoints */}
      <div className="hidden md:flex fixed top-0 left-0 right-0 z-50 w-full h-20 px-5 pt-5 bg-gradient-to-b from-stone-100 to-stone-100/0 justify-between items-start logged-out-nav">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate('/');
          }}
          className="cursor-pointer flex-shrink-0"
        >
          <img 
            src="/images/swiper-logo.png" 
            alt="Swiper Logo" 
            className="w-50 h-8 object-contain"
          />
        </button>
        {showAuthButtons && (
          <div className="flex justify-start items-start gap-3">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Force navigation with window.location.href
                window.location.href = '/login';
              }}
              className="w-24 h-10 px-5 py-2.5 bg-white border border-neutral-300 rounded-lg flex justify-center items-center gap-2.5 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <div className="justify-start text-black text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Log in</div>
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Force navigation with window.location.href
                window.location.href = '/create-account';
              }}
              className="w-48 h-10 max-w-96 px-4 py-2 bg-green-600 rounded-lg border border-neutral-300 flex justify-center items-center gap-2.5 hover:bg-green-700 transition-colors cursor-pointer"
            >
              <div className="justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Create account</div>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
