import React from 'react';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
} from "@/components/atoms/dialog";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import { SwiperButton } from './swiper-button';

// Force hot reload - AlertDialogCancel and AlertDialogAction removed
const SwiperDialog = ({
  open,
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "default",
  cancelVariant = "outline",
  className,
  contentClassName,
  headerClassName,
  footerClassName,
  titleClassName,
  descriptionClassName,
  children,
  ...props
}) => {
  const controlledOpen = typeof open !== "undefined" ? open : isOpen;

  const handleConfirm = () => {
    console.log('SwiperDialog handleConfirm called');
    onConfirm?.();
  };

  const handleCancel = () => {
    console.log('SwiperDialog handleCancel called');
    onCancel?.();
    onOpenChange?.(false);
  };

  return (
    <Dialog open={controlledOpen} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay onClick={() => onOpenChange?.(false)} />
        <DialogContent 
          className={`w-full h-full inline-flex flex-col justify-center items-center shadow-none border-none bg-transparent p-0 [&>button]:hidden z-[10000] px-5 overflow-x-hidden focus:outline-none focus:border-none focus:ring-0 ${contentClassName || ''}`}
          onClick={() => onOpenChange?.(false)}
        >
          <DialogTitle className="sr-only">
            {title || 'Dialog'}
          </DialogTitle>
          <DeckWrapper 
            className="w-full h-screen flex flex-col justify-center items-center gap-2.5 overflow-x-hidden focus:outline-none focus:border-none focus:ring-0" 
            maxWidth={null}
            minWidth={null}

            style={{ paddingTop: 0, paddingBottom: 0, height: '100vh' }}
          >
            <div 
              className="w-full max-w-[500px] bg-white rounded-xl shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex flex-col justify-start items-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="self-stretch h-12 px-3 pb-px bg-neutral-neutral-100 border-b border-neutral-neutral-300 flex flex-col justify-center items-start">
                <div className="self-stretch inline-flex justify-center items-center gap-2.5">
                  <div className="flex-1 justify-start text-neutral-neutral-700 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">{title}</div>
                </div>
              </div>
              {description && (
                <div className="self-stretch px-3 py-5 flex flex-col justify-start items-start gap-4">
                  <div className="text-neutral-neutral-700 text-base font-normal font-['Be_Vietnam_Pro'] leading-tight">{description}</div>
                </div>
              )}
              <div className="self-stretch px-3 py-5 flex flex-col justify-start items-start gap-4 max-h-[500px] overflow-y-auto overflow-x-hidden">
                {children}
                {(confirmText || cancelText) && (
                  <div 
                    className="self-stretch flex flex-col justify-start items-start gap-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {confirmText && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
                        className="self-stretch h-12 px-4 py-2 bg-red-300 rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 inline-flex justify-center items-center gap-2.5"
                      >
                        <span className="text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">{confirmText}</span>
                      </button>
                    )}
                    {cancelText && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                        className="self-stretch h-12 px-4 py-2 bg-neutral-neutral-100 rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 inline-flex justify-center items-center gap-2.5"
                      >
                        <span className="text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">{cancelText}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </DeckWrapper>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default SwiperDialog; 