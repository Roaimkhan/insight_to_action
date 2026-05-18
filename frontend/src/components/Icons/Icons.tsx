import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// ── Source Type Icons ─────────────────────────────────────────────────────

/** PDF — Document with folded corner */
export const PdfIcon = React.memo<IconProps>(({ size = 20, color = '#7A96B8' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M5 2h7l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M12 2v4h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 11h6M7 14h4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
));
PdfIcon.displayName = 'PdfIcon';

/** CSV — Grid of cells */
export const CsvIcon = React.memo<IconProps>(({ size = 20, color = '#7A96B8' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="3" y="3" width="14" height="14" rx="2" stroke={color} strokeWidth="1.5" />
    <line x1="3" y1="7.5" x2="17" y2="7.5" stroke={color} strokeWidth="1" />
    <line x1="3" y1="12" x2="17" y2="12" stroke={color} strokeWidth="1" />
    <line x1="8" y1="3" x2="8" y2="17" stroke={color} strokeWidth="1" />
    <line x1="13" y1="3" x2="13" y2="17" stroke={color} strokeWidth="1" />
  </svg>
));
CsvIcon.displayName = 'CsvIcon';

/** WEB — Globe with signal arcs */
export const WebIcon = React.memo<IconProps>(({ size = 20, color = '#7A96B8' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.5" />
    <ellipse cx="10" cy="10" rx="3" ry="7" stroke={color} strokeWidth="1" />
    <line x1="3" y1="10" x2="17" y2="10" stroke={color} strokeWidth="1" />
    <line x1="10" y1="3" x2="10" y2="17" stroke={color} strokeWidth="1" />
  </svg>
));
WebIcon.displayName = 'WebIcon';

/** TABLE — Rectangle with horizontal lines */
export const TableIcon = React.memo<IconProps>(({ size = 20, color = '#7A96B8' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="3" y="4" width="14" height="12" rx="2" stroke={color} strokeWidth="1.5" />
    <line x1="3" y1="8" x2="17" y2="8" stroke={color} strokeWidth="1" />
    <line x1="3" y1="12" x2="17" y2="12" stroke={color} strokeWidth="1" />
    <line x1="10" y1="4" x2="10" y2="16" stroke={color} strokeWidth="1" />
  </svg>
));
TableIcon.displayName = 'TableIcon';

/** REALTIME — Signal waves / expanding arcs */
export const RealtimeIcon = React.memo<IconProps>(({ size = 20, color = '#7A96B8' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="14" r="2" fill={color} />
    <path d="M6 11a5.6 5.6 0 018 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M4 8a8.5 8.5 0 0112 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M2 5a11.5 11.5 0 0116 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
));
RealtimeIcon.displayName = 'RealtimeIcon';


// ── Status Icons ─────────────────────────────────────────────────────────

/** Pending — hollow circle */
export const PendingIcon = React.memo<IconProps>(({ size = 16, color = '#3D5A7A' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="5.5" stroke={color} strokeWidth="1.5" />
  </svg>
));
PendingIcon.displayName = 'PendingIcon';

/** Active — filled circle with ring (spinning handled via CSS) */
export const ActiveIcon = React.memo<IconProps>(({ size = 16, color = '#00E5FF', className }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    <circle cx="8" cy="8" r="3" fill={color} />
    <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" />
  </svg>
));
ActiveIcon.displayName = 'ActiveIcon';

/** Complete — checkmark */
export const CompleteIcon = React.memo<IconProps>(({ size = 16, color = '#00FF87' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" opacity="0.3" />
    <path d="M5 8l2.5 2.5L11.5 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
CompleteIcon.displayName = 'CompleteIcon';

/** Failed — cross */
export const FailedIcon = React.memo<IconProps>(({ size = 16, color = '#FF3D5A' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" opacity="0.3" />
    <path d="M6 6l4 4M10 6l-4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
));
FailedIcon.displayName = 'FailedIcon';

/** RolledBack — back arrow */
export const RolledBackIcon = React.memo<IconProps>(({ size = 16, color = '#FFB020' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M6 4L3 7.5L6 11" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 7.5h7a3 3 0 010 6H8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
));
RolledBackIcon.displayName = 'RolledBackIcon';


// ── UI Icons ─────────────────────────────────────────────────────────────

/** Arrow Right */
export const ArrowRightIcon = React.memo<IconProps>(({ size = 20, color = '#E8F4FF' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M4 10h12M12 6l4 4-4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
ArrowRightIcon.displayName = 'ArrowRightIcon';

/** Play */
export const PlayIcon = React.memo<IconProps>(({ size = 20, color = '#E8F4FF' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M6 4l10 6-10 6V4z" fill={color} />
  </svg>
));
PlayIcon.displayName = 'PlayIcon';

/** Lightning Bolt */
export const BoltIcon = React.memo<IconProps>(({ size = 20, color = '#E8F4FF' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M11 2L5 11h4l-1 7 7-9h-4l1-7z" fill={color} />
  </svg>
));
BoltIcon.displayName = 'BoltIcon';

/** Settings Gear */
export const GearIcon = React.memo<IconProps>(({ size = 20, color = '#7A96B8' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="2.5" stroke={color} strokeWidth="1.5" />
    <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
));
GearIcon.displayName = 'GearIcon';

/** Shield (for credibility) */
export const ShieldIcon = React.memo<IconProps>(({ size = 20, color = '#7A96B8' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M10 2L4 5v4c0 4.5 2.6 7.3 6 9 3.4-1.7 6-4.5 6-9V5l-6-3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M7.5 10l2 2 3.5-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
ShieldIcon.displayName = 'ShieldIcon';

/** Brain (for AI/Agent) */
export const BrainIcon = React.memo<IconProps>(({ size = 20, color = '#7A96B8' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M10 18V10" stroke={color} strokeWidth="1.3" />
    <path d="M10 10c-2 0-4-1.5-4-4s2-4 4-4 4 1.5 4 4-2 4-4 4z" stroke={color} strokeWidth="1.5" />
    <path d="M6.5 7.5C5 7 4 5.5 4 4.5 4 3 5 2 6.5 2" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    <path d="M13.5 7.5C15 7 16 5.5 16 4.5 16 3 15 2 13.5 2" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="8" cy="6" r="1" fill={color} />
    <circle cx="12" cy="6" r="1" fill={color} />
  </svg>
));
BrainIcon.displayName = 'BrainIcon';
