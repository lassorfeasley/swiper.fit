import React from "react";
import { Drawer, DrawerContent } from "@/components/shadcn/drawer";
import { SwiperSheet } from "@/components/shared/SwiperSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { FormHeader } from "../shadcn/sheet";
import { cn } from "@/lib/utils";
import FormSectionWrapper from "@/components/shared/forms/wrappers/FormSectionWrapper";
import { useAccount } from "@/contexts/AccountContext";

interface SwiperFormProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  leftAction?: () => void;
  rightAction?: () => void;
  rightEnabled?: boolean;
  leftText?: string;
  rightText?: string;
  padding?: 0 | 4;
  className?: string;
}

const SwiperForm: React.FC<SwiperFormProps> = ({
  children,
  open,
  onOpenChange,
  title,
  description,
  leftAction,
  rightAction,
  rightEnabled,
  leftText,
  rightText,
  padding = 0,
  className,
}) => {
  const isMobile = useIsMobile();
  const { isDelegated } = useAccount();
  // Always cover the full viewport height, even when sharing/delegate nav is active
  const delegateOverlayStyle = { top: 0, height: "100%" };

  return (
    <div>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent
            className={cn("p-0 h-[100dvh]", className)}
            style={delegateOverlayStyle}
          >
            {leftAction && (
              <FormHeader
                className={padding === 0 ? "m-0" : undefined}
                leftText={leftText}
                leftAction={leftAction}
                title={title}
                rightText={rightText}
                rightAction={rightAction}
                rightEnabled={rightEnabled}
              />
            )}
            {children}
          </DrawerContent>
        </Drawer>
      ) : (
        <SwiperSheet
          open={open}
          onOpenChange={onOpenChange}
          className={cn("p-0", className)}
          style={delegateOverlayStyle}
          title={title}
          description={description}
        >
          {leftAction && (
            <FormHeader
              className={padding === 0 ? "m-0" : undefined}
              leftText={leftText}
              leftAction={leftAction}
              title={title}
              rightText={rightText}
              rightAction={rightAction}
              rightEnabled={rightEnabled}
            />
          )}
          {children}
        </SwiperSheet>
      )}
    </div>
  );
};

// Convenient section wrapper for form content
interface SwiperFormSectionProps {
  children: React.ReactNode;
  bordered?: boolean;
  className?: string;
}

const SwiperFormSection: React.FC<SwiperFormSectionProps> = ({ children, bordered = true, className }) => {
  return (
    <FormSectionWrapper
      className={cn(
        "py-4 px-4",
        bordered && "border-b border-neutral-300 last:border-b-0",
        className
      )}
      bordered={bordered}
    >
      {children}
    </FormSectionWrapper>
  );
};

// Attach as a static property so callers can do <SwiperForm.Section>
(SwiperForm as any).Section = SwiperFormSection;

export { SwiperFormSection };

export default SwiperForm; 