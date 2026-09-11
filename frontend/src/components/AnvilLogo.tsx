import React from 'react';
import logoImg from '@/assets/logo.png';
import { cn } from '@/utils/cn';

interface AnvilLogoProps {
  size?: number;
  className?: string;
  showContainer?: boolean;
}

export const AnvilLogo: React.FC<AnvilLogoProps> = ({
  size = 42,
  className,
  showContainer = true,
}) => {
  const imageElement = (
    <img
      src={logoImg}
      alt="Anvil Logo"
      className="w-full h-full object-contain select-none pointer-events-none drop-shadow-sm"
      style={{ maxWidth: '100%', maxHeight: '100%' }}
    />
  );

  if (!showContainer) {
    return (
      <div
        className={cn('flex items-center justify-center shrink-0', className)}
        style={{ width: size, height: size }}
      >
        {imageElement}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl bg-[#17181d] border border-[#262831] p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden',
        className
      )}
      style={{ width: size, height: size }}
    >
      {imageElement}
    </div>
  );
};



