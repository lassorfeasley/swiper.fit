import React from 'react';
import { ListChecks } from 'lucide-react';

interface OGImageWrapperProps {
  imageUrl: string;
  fallbackUrl?: string;
  alt: string;
  routineName?: string;
  onRoutineClick?: () => void;
  showRoutineLink?: boolean;
  className?: string;
}

export const OGImageWrapper: React.FC<OGImageWrapperProps> = ({
  imageUrl,
  fallbackUrl,
  alt,
  routineName,
  onRoutineClick,
  showRoutineLink = false,
  className = '',
}) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    console.log('Image failed to load:', target.src);
    if (fallbackUrl) {
      console.log('Falling back to default image');
      target.src = fallbackUrl;
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    console.log('Image loaded successfully:', target.src);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onRoutineClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onRoutineClick();
    }
  };

  return (
    <div className={`w-full md:max-w-[500px] md:mx-auto rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 overflow-hidden flex flex-col ${className}`}>
      <img 
        data-layer="open-graph-image"
        className="OpenGraphImage w-full h-auto" 
        src={imageUrl || fallbackUrl} 
        alt={alt}
        draggable={false}
        style={{ maxHeight: '256px', objectFit: 'cover', display: 'block' }}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      {showRoutineLink && routineName && (
        <div 
          data-layer="routine-link"
          className="RoutineLink w-full h-11 max-w-[500px] px-3 bg-neutral-Neutral-50 border-t border-neutral-neutral-300 inline-flex justify-between items-center"
          onClick={onRoutineClick}
          style={{ cursor: onRoutineClick ? "pointer" : "default" }}
          role={onRoutineClick ? "button" : undefined}
          tabIndex={onRoutineClick ? 0 : undefined}
          onKeyDown={onRoutineClick ? handleKeyDown : undefined}
          aria-label={onRoutineClick ? (routineName === 'View routine' ? "Open routine" : "View routine history") : undefined}
        >
          <div data-layer="routine-name" className="justify-center text-neutral-neutral-600 text-sm font-semibold font-['Be_Vietnam_Pro'] leading-5">
            {routineName} 
          </div>
          <div data-layer="lucide-icon" data-icon="list-checks" className="LucideIcon size-6 relative overflow-hidden">
            <ListChecks className="w-6 h-6 text-neutral-neutral-600" />
          </div>
        </div>
      )}
    </div>
  );
};

