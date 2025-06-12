import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Eye } from "lucide-react"

const TextInput = React.forwardRef(({
  className,
  variant = "default",
  icon,
  error,
  disabled,
  customPlaceholder,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  const getInputStyles = () => {
    const baseStyles = "h-14 p-4 !bg-white rounded-sm outline outline-1 outline-offset-[-1px] text-base font-normal font-['Space_Grotesk'] leading-normal"
    
    if (disabled) {
      return cn(baseStyles, "outline-neutral-300 text-neutral-300")
    }
    
    if (error) {
      return cn(baseStyles, "outline-red-400 text-slate-500")
    }
    
    if (isFocused) {
      return cn(baseStyles, "outline-slate-600 text-black")
    }
    
    if (isHovered) {
      return cn(baseStyles, "outline-slate-600 text-slate-500")
    }
    
    return cn(baseStyles, "outline-neutral-300 text-slate-500")
  }

  return (
    <div className="w-full inline-flex flex-col justify-start items-start gap-2">
      <div 
        className={cn(
          "relative w-full",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Input
          ref={ref}
          className={getInputStyles()}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={customPlaceholder}
          {...props}
        />
        {icon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <span className="text-red-400 text-sm">{error}</span>
      )}
    </div>
  )
})

TextInput.displayName = "TextInput"

export { TextInput } 