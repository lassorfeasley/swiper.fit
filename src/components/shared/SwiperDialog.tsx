import React from 'react';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Button } from '@/components/shadcn/button';

// Force hot reload - AlertDialogCancel and AlertDialogAction removed
interface SwiperDialogProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: "default" | "destructive";
  className?: string;
  confirmVariant?: "default" | "affirmative" | "destructive" | "outline" | "ghost";
  cancelVariant?: "default" | "affirmative" | "destructive" | "outline" | "ghost";
  contentClassName?: string;
  containerClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  headerRight?: React.ReactNode;
  primaryAction?: React.ReactNode;
  footer?: React.ReactNode;
  hideFooter?: boolean;
  showHeaderDismiss?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnConfirm?: boolean;
  closeOnCancel?: boolean;
  size?: "sm" | "md" | "lg";
  align?: "left" | "center" | "right";
  tone?: "neutral" | "warning" | "error";
  maxBodyHeight?: string;
  showCloseButton?: boolean;
}

const SwiperDialog: React.FC<SwiperDialogProps> = ({
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
  contentClassName,
  containerClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
  headerRight,
  primaryAction,
  footer,
  hideFooter = false,
  showHeaderDismiss = true,
  closeOnOverlayClick = true,
  closeOnConfirm = true,
  closeOnCancel = true,
  size = "md",
  align = "center",
  tone = "neutral",
  maxBodyHeight = "60vh",
  showCloseButton = false,
  children,
  ...props
}) => {
  const controlledOpen = typeof open !== "undefined" ? open : isOpen;

  const widthClass =
    size === "sm" ? "max-w-[420px]" : size === "lg" ? "max-w-[640px]" : "max-w-[500px]";

  // Keep existing max width but also ensure 20px horizontal padding on mobile
  const mobileSafeWidthClass =
    size === "sm"
      ? "max-w-[min(100vw-40px,420px)]"
      : size === "lg"
      ? "max-w-[min(100vw-40px,640px)]"
      : "max-w-[min(100vw-40px,500px)]";

  const handleConfirm = () => {
    onConfirm?.();
    if (closeOnConfirm) onOpenChange?.(false);
  };

  const handleCancel = () => {
    onCancel?.();
    if (closeOnCancel) onOpenChange?.(false);
  };

  const handleBackdropClick = () => {
    if (closeOnOverlayClick) onOpenChange?.(false);
  };

  return (
    <Dialog open={controlledOpen} onOpenChange={onOpenChange} {...props}>
      <DialogPortal>
        <DialogOverlay onClick={handleBackdropClick} />
        <DialogContent
          className={`w-full ${widthClass} ${mobileSafeWidthClass} shadow-none border border-neutral-300 bg-stone-100 p-0 rounded-lg overflow-hidden ${showCloseButton ? '' : '[&>button]:hidden'} ${contentClassName || ''}`}
          onClick={handleBackdropClick}
          tabIndex={-1}
        >
          <DialogTitle className="sr-only">{title || 'Dialog'}</DialogTitle>
          <div
            className={`w-full flex flex-col justify-start items-stretch overflow-hidden ${containerClassName || ''}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="swiper-dialog-title"
          >
              {title && (
                <div className={`self-stretch h-11 px-3 ${tone === 'error' ? 'bg-red-50' : 'bg-neutral-neutral-200'} border-b border-neutral-300 inline-flex justify-start items-center ${headerClassName || ''}`}>
                  <div id="swiper-dialog-title" className="flex-1 justify-start text-neutral-neutral-700 text-lg font-medium leading-tight">{title}</div>
                  {headerRight ?? (showHeaderDismiss ? (
                    <button
                      onClick={() => onOpenChange?.(false)}
                      className="w-4 h-4 bg-red-300 rounded-full border border-neutral-300 hover:bg-red-400 transition-colors cursor-pointer focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0"
                      aria-label="Close dialog"
                    />
                  ) : null)}
                </div>
              )}
              {description && (
                <div className="self-stretch px-3 py-5 flex flex-col justify-start items-start gap-4">
                  <div className="text-neutral-neutral-700 text-base leading-tight">{description}</div>
                </div>
              )}
              {primaryAction}
              {React.Children.count(children) > 0 && (
                <div className={`self-stretch px-3 pt-3 bg-stone-100 flex flex-col justify-start items-start gap-3 overflow-y-auto overflow-x-hidden ${bodyClassName || ''}`}
                     style={{ maxHeight: maxBodyHeight }}>
                  {children}
                </div>
              )}
              {!hideFooter && (
                footer ? (
                  <div className={footerClassName}>{footer}</div>
                ) : ((confirmText || cancelText) && (
                  <div className={`self-stretch grid grid-cols-1 gap-3 p-3 mt-0 ${footerClassName || ''}`}>
                    {confirmText && (
                      <Button onClick={handleConfirm} variant={confirmVariant}>
                        {confirmText}
                      </Button>
                    )}
                    {cancelText && (
                      <Button onClick={handleCancel} variant={cancelVariant}>
                        {cancelText}
                      </Button>
                    )}
                  </div>
                ))
              )}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default SwiperDialog; 