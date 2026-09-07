import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import logoImg from '../assets/images/soccerbridge_logo_1785110725358.jpg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSlogan?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSlogan = false, className = '' }) => {
  const { t } = useLanguage();

  const imageHeights = {
    sm: 'h-8 sm:h-9',
    md: 'h-11 sm:h-12',
    lg: 'h-24 sm:h-28',
    xl: 'h-36 sm:h-44',
  };

  const sloganSizes = {
    sm: 'text-[9px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className={`${imageHeights[size]} flex items-center justify-center`}>
        <img
          src={logoImg}
          alt="SoccerBridge - Your Pitch. Your Network. Your Pro Future."
          referrerPolicy="no-referrer"
          className="h-full w-auto object-contain drop-shadow-[0_0_15px_rgba(37,99,235,0.4)]"
        />
      </div>

      {showSlogan && (
        <span className={`italic font-medium text-blue-200/90 tracking-wide mt-1.5 text-center ${sloganSizes[size]}`}>
          {t('slogan')}
        </span>
      )}
    </div>
  );
};

