import React from 'react'

interface AvatarCircleProps {
  name?: string | null
  backgroundColor: string
  color: string
  size?: number
  imageUrl?: string | null
}

export const AvatarCircle: React.FC<AvatarCircleProps> = ({
  name,
  backgroundColor,
  color,
  size = 48,
  imageUrl,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor,
      color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-serif)',
      fontSize: `${size * 0.027}rem`,
      fontWeight: 600,
      flexShrink: 0,
      overflow: 'hidden',
    }}
  >
    {imageUrl ? (
      <img
        src={imageUrl}
        alt={name || 'Avatar'}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    ) : (
      (name || '?')[0].toUpperCase()
    )}
  </div>
)
