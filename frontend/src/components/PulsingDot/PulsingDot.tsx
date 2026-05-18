import React from 'react';
import './PulsingDot.css';

interface PulsingDotProps {
  color?: string;
  size?: number;
}

const PulsingDot = React.memo<PulsingDotProps>(({ color = '#00E5FF', size = 8 }) => {
  return (
    <span
      className="pulsing-dot"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `0 0 ${size}px ${color}`,
      }}
    />
  );
});

PulsingDot.displayName = 'PulsingDot';
export default PulsingDot;
