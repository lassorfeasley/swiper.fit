import React from "react";
import { Drawer, DrawerContent } from "@/components/atoms/drawer";
import { SwiperSheet } from "@/components/molecules/swiper-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { FormHeader } from "../atoms/sheet";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import FormSectionWrapper from "@/components/common/forms/wrappers/FormSectionWrapper";
import { useAccount } from "@/contexts/AccountContext";

const SwiperForm = ({
  children,
  open,
  onOpenChange,
  title,
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
  const delegateOverlayStyle = isDelegated
    ? { top: "var(--header-height)", height: "calc(100% - var(--header-height))" }
    : undefined;

  return (
    <div>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent
            className={cn("p-0 max-h-[90dvh] z-[100]", className)}
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
          className={cn("z-[100] p-0", className)}
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
        </SwiperSheet>
      )}
    </div>
  );
};

SwiperForm.propTypes = {
  padding: PropTypes.oneOf([0, 4]),
  className: PropTypes.string,
};

// Convenient section wrapper for form content
const SwiperFormSection = ({ children, bordered = true, className }) => {
  return (
    <FormSectionWrapper
      className={cn(
        "py-4 px-4",
        bordered && "border-b border-neutral-300 last:border-b-0",
        className
      )}
    >
      {children}
    </FormSectionWrapper>
  );
};

SwiperFormSection.propTypes = {
  children: PropTypes.node.isRequired,
  bordered: PropTypes.bool,
  className: PropTypes.string,
};

// Attach as a static property so callers can do <SwiperForm.Section>
SwiperForm.Section = SwiperFormSection;

export { SwiperFormSection };

export default SwiperForm; 