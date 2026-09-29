import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

export type NicheIconType = 'lifestyle' | 'comedy' | 'education' | 'beauty' | 'food' | 'fitness' | 'tech' | 'music' | 'custom';

// Line icons for each creator niche.
export function NicheIcon({ type, color }: { type: NicheIconType; color: string }) {
  const strokeColor = color;
  switch (type) {
    case 'lifestyle':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9 21V12H15V21"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'comedy':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={strokeColor} strokeWidth="2" />
          <Path
            d="M8 14C8 14 9.5 17 12 17C14.5 17 16 14 16 14"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Circle cx="9" cy="9.5" r="1.25" fill={strokeColor} />
          <Circle cx="15" cy="9.5" r="1.25" fill={strokeColor} />
        </Svg>
      );
    case 'education':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M22 10L12 5L2 10L12 15L22 10Z"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M6 12V17C6 18.6569 8.68629 20 12 20C15.3137 20 18 18.6569 18 17V12"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M22 10V16" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'beauty':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="6" r="2.5" stroke={strokeColor} strokeWidth="2" />
          <Path
            d="M6 21L8 10H16L18 21H6Z"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M10 10V14" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'food':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M18 4V10C18 11.1046 17.1046 12 16 12H14C12.8954 12 12 11.1046 12 10V4M15 4V20"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M6 4V20M9 4V10C9 11.1046 8.10457 12 7 12H5C3.89543 12 3 11.1046 3 10V4"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'fitness':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6.5 6.5L17.5 17.5M4 8L8 4M16 20L20 16M3 11L11 3M13 21L21 13"
            stroke={strokeColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'tech':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 20H21M5 16V17M10 12V17M15 8V17M20 4V17"
            stroke={strokeColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M4 11L9 7L14 10L20 4"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'music':
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 18V5L20 3V16M9 9L20 7"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="6" cy="18" r="3" stroke={strokeColor} strokeWidth="2" />
          <Circle cx="17" cy="16" r="3" stroke={strokeColor} strokeWidth="2" />
        </Svg>
      );
    default:
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 4V20M4 12H20"
            stroke={strokeColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
  }
}
