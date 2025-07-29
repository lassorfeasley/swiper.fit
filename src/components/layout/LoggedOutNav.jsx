import { useNavigate } from "react-router-dom";
import { MoveUpRight } from "lucide-react";

export default function LoggedOutNav({ showAuthButtons = true }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Layout - Only visible on mobile breakpoints */}
      <div className="md:hidden w-full flex-shrink-0 bg-white logged-out-nav">
        {showAuthButtons && (
          <div className="w-full h-11 border-b border-neutral-neutral-300 inline-flex justify-start items-center">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Login button clicked (mobile)');
                navigate('/login');
              }}
              className="flex-1 h-11 px-5 py-2.5 border-r border-neutral-neutral-300 flex justify-center items-center gap-2 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <div className="justify-start text-black text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">Log in</div>
              <MoveUpRight className="w-2.5 h-2.5 text-neutral-neutral-700" />
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Create account button clicked (mobile)');
                navigate('/create-account');
              }}
              className="flex-1 h-11 max-w-96 px-4 py-2 bg-green-600 flex justify-center items-center gap-2 hover:bg-green-700 transition-colors cursor-pointer"
            >
              <div className="justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Create account</div>
              <MoveUpRight className="w-2.5 h-2.5 text-white" />
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
              className="w-28 h-11 object-contain"
            />
          </button>
        </div>
      </div>

      {/* Desktop Layout - Hidden on mobile, visible on md+ breakpoints */}
      <div className="hidden md:flex w-full h-11 pl-5 border-b border-neutral-neutral-300 justify-between items-center bg-white logged-out-nav">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate('/');
          }}
          className="w-28 inline-flex flex-col justify-start items-start gap-2.5 cursor-pointer p-1 rounded flex-shrink-0"
        >
          <img 
            src="/images/swiper-logo.png" 
            alt="Swiper Logo" 
            className="w-28 h-11 object-contain"
          />
        </button>
        {showAuthButtons && (
          <div className="flex items-center flex-shrink-0">
            <div className="border-b border-neutral-neutral-300">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Login button clicked (desktop)');
                  navigate('/login');
                }}
                className="h-11 px-5 py-2.5 border-l border-neutral-neutral-300 flex justify-center items-center gap-2.5 hover:bg-neutral-100 transition-colors cursor-pointer flex-shrink-0"
              >
                <div className="justify-start text-black text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Log in</div>
              </button>
            </div>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Create account button clicked (desktop)');
                navigate('/create-account');
              }}
              className="h-11 w-48 max-w-96 px-4 py-2 bg-green-600 flex justify-center items-center gap-2.5 hover:bg-green-700 transition-colors cursor-pointer flex-shrink-0"
            >
              <div className="justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Create account</div>
            </button>
          </div>
        )}
      </div>
    </>
  );
} 