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
        <DialogOverlay className="bg-white/65 backdrop-blur-[.1px] z-[9999]" />
        <DialogContent 
          className={`w-full h-full inline-flex flex-col justify-center items-center shadow-none border-none bg-transparent p-0 [&>button]:hidden z-[10000] ${contentClassName || ''}`}
        >
          <DialogTitle className="sr-only">
            {title || 'Dialog'}
          </DialogTitle>
          <DeckWrapper 
            className="w-full h-screen flex flex-col justify-center items-center gap-2.5" 
            maxWidth={400} 
            minWidth={325}
            extendToBottom={true}
            style={{ paddingTop: 0, paddingBottom: 0, height: '100vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="w-full bg-white border-b border-neutral-neutral-300 flex flex-col justify-start items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <div className="self-stretch h-12 px-3 bg-neutral-50 border-b border-neutral-neutral-300 flex flex-col justify-center items-start">
                  <div className="self-stretch inline-flex justify-center items-center gap-2.5">
                    <div className="flex-1 justify-start text-neutral-neutral-700 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">{title}</div>
                  </div>
                </div>
              )}
              {description && (
                <div className="self-stretch px-3 py-5 flex flex-col justify-start items-start gap-4">
                  <div className="text-neutral-neutral-700 text-base font-normal font-['Be_Vietnam_Pro'] leading-tight">{description}</div>
                </div>
              )}
              <div className="self-stretch max-h-[500px] overflow-y-auto">
                {children}
                {(confirmText || cancelText) && (
                  <div 
                    className="self-stretch px-3 py-5 flex flex-col justify-start items-start gap-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {confirmText && (
                      <SwiperButton 
                        variant={confirmVariant}
                        onClick={(e) => {
                          console.log('Confirm button clicked!');
                          e.stopPropagation();
                          handleConfirm();
                        }}
                        className="self-stretch h-12 px-4 py-2 inline-flex justify-center items-center gap-2.5"
                      >
                        {confirmText}
                      </SwiperButton>
                    )}
                    {cancelText && (
                      <SwiperButton 
                        variant={cancelVariant}
                        onClick={(e) => {
                          console.log('Cancel button clicked!');
                          e.stopPropagation();
                          handleCancel();
                        }}
                        className="self-stretch h-12 px-4 py-2 inline-flex justify-center items-center gap-2.5"
                      >
                        {cancelText}
                      </SwiperButton>
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