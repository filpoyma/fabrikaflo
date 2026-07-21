import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}

/** Line-art peony — used as botanical marker across the admin (empty-states, dashboard). */
export const PeonyIcon: React.FC<IconProps> = ({
  size = 32,
  color = 'currentColor',
  className,
  style,
  strokeWidth = 1.1,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M32 10 C 22 15, 17 24, 22 34 C 12 34, 8 42, 14 50 C 24 54, 34 50, 36 42 C 42 50, 54 46, 55 36 C 55 26, 46 22, 40 24 C 44 15, 40 8, 32 10 Z" />
    <path d="M28 22 C 22 24, 20 32, 26 36 C 22 40, 24 46, 30 46 C 36 46, 40 42, 40 36 C 46 38, 50 30, 46 26 C 42 22, 34 22, 28 22 Z" />
    <path d="M32 32 C 28 34, 28 40, 34 40 C 40 40, 40 34, 36 32 Z" />
    <path d="M14 52 C 8 56, 5 60, 4 62" />
    <path d="M54 48 C 58 52, 60 56, 62 60" />
  </svg>
);

/** Small delivery scooter — used for delivery placeholders. */
export const DeliveryIcon: React.FC<IconProps> = ({
  size = 32,
  color = 'currentColor',
  className,
  style,
  strokeWidth = 1.1,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    {/* Front wheel */}
    <circle cx="14" cy="46" r="7" />
    <circle cx="14" cy="46" r="2" fill={color} stroke="none" />
    {/* Rear wheel */}
    <circle cx="50" cy="46" r="7" />
    <circle cx="50" cy="46" r="2" fill={color} stroke="none" />
    {/* Scooter body */}
    <path d="M20 46 L 36 46 L 38 34 L 24 34 Z" />
    {/* Bouquet box */}
    <rect x="12" y="22" width="14" height="12" rx="1" />
    <path d="M18 22 L 18 18 M 20 22 L 20 16 M 16 22 L 16 18" />
    {/* Handle bar */}
    <path d="M38 34 L 46 20 L 52 20" />
    <path d="M50 20 L 54 22" />
  </svg>
);

/** Simple location pin, used for delivery-address labels. */
export const PinIcon: React.FC<IconProps> = ({
  size = 14,
  color = 'currentColor',
  className,
  style,
  strokeWidth = 1.3,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

/** Small delivery van, used inline in table cells and inline delivery type labels. */
export const VanIcon: React.FC<IconProps> = ({
  size = 14,
  color = 'currentColor',
  className,
  style,
  strokeWidth = 1.3,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M2 15V7a1 1 0 0 1 1-1h11v9" />
    <path d="M14 9h4l3 3v3" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <path d="M9 17h6" />
  </svg>
);

/** Simple pickup / store icon for pickup labels. */
export const PickupIcon: React.FC<IconProps> = ({
  size = 14,
  color = 'currentColor',
  className,
  style,
  strokeWidth = 1.3,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="M3 7h18l-1 4H4L3 7z" />
    <path d="M5 11v9h14v-9" />
    <path d="M10 20v-5h4v5" />
  </svg>
);
