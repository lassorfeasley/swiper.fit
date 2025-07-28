import React from 'react';
import {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/atoms/alert-dialog";
import { SwiperButton } from './swiper-button';

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
    <AlertDialog open={controlledOpen} onOpenChange={onOpenChange}>
      <AlertDialogPortal>
        <AlertDialogOverlay className="backdrop-blur-[2px] fixed inset-0 z-50" />
        <AlertDialogContent 
          className={`w-[1340px] h-[866px] px-5 bg-white/80 backdrop-blur-[2px] inline-flex flex-col justify-center items-center shadow-none ${contentClassName || ''}`}
          {...props}
        >
          <div className="w-96 flex-1 max-w-96 border-l border-r border-neutral-neutral-300 flex flex-col justify-center items-center gap-2.5">
            <div className="w-full max-w-[500px] bg-white flex flex-col justify-start items-center">
              {title && (
                <AlertDialogHeader className={`w-full ${headerClassName || ''}`}>
                  <AlertDialogTitle className={`self-stretch h-12 px-3 bg-white border-t border-b border-neutral-neutral-300 flex flex-col justify-center items-start ${titleClassName || ''}`}>
                    <div className="self-stretch inline-flex justify-center items-center gap-2.5">
                      <div className="flex-1 justify-start text-neutral-neutral-700 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">{title}</div>
                    </div>
                  </AlertDialogTitle>
                </AlertDialogHeader>
              )}
              
              {description && (
                <AlertDialogDescription className={`text-neutral-neutral-700 text-base font-normal font-['Be_Vietnam_Pro'] leading-tight ${descriptionClassName || ''}`}>
                  {description}
                </AlertDialogDescription>
              )}
              
              {children}
              
                              <AlertDialogFooter className={`self-stretch px-3 py-5 flex flex-col justify-center items-center gap-4 w-full ${footerClassName || ''}`}>
                <AlertDialogAction asChild className="w-full m-0 p-0 !m-0">
                  <SwiperButton 
                    variant={confirmVariant}
                    onClick={handleConfirm}
                    className="w-full !m-0 !ml-0"
                  >
                    {confirmText}
                  </SwiperButton>
                </AlertDialogAction>
                
                <AlertDialogCancel asChild className="w-full m-0 p-0 !m-0">
                  <SwiperButton 
                    variant={cancelVariant}
                    onClick={handleCancel}
                    className="w-full !m-0 !ml-0"
                  >
                    {cancelText}
                  </SwiperButton>
                </AlertDialogCancel>
              </AlertDialogFooter>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialog>
  );
};

export default SwiperDialog; 