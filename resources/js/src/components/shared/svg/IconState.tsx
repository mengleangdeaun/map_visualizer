import React from 'react';

// Imports (Fixed typo: calendardSvg -> calendarSvg)
import boxSvg from '@/assets/svg/box.svg';
import userSvg from '@/assets/svg/user.svg';
import databaseSvg from '@/assets/svg/database.svg';
import mapSvg from '@/assets/svg/map.svg';



const iconsvgMap = {
  box: boxSvg,
  user: userSvg,
  database: databaseSvg,
  map: mapSvg,

} as const;

// 2. Extract types from the dictionary keys for strict autocomplete
export type IconsvgName = keyof typeof iconsvgMap;

type iconsvgProps = {
  name: IconsvgName; // Replaces 'src'
  alt?: string;           // Made optional (falls back to a default)
  size?: number;
  className?: string;
  paddingY?: string;
};

// 3. Main unified component
export const Iconsvg: React.FC<iconsvgProps> = ({
  name,
  alt,
  size = 120,
  className = '',
  paddingY = 'py-2',
}) => {
  const src = iconsvgMap[name];

  return (
    <div className={`flex flex-col items-center justify-center ${paddingY}`}>
      <img
        src={src}
        alt={alt || `${name} iconsvg`}
        width={size}
        height={size}
        className={`object-contain ${className}`}
        loading="lazy"
      />
    </div>
  );
};