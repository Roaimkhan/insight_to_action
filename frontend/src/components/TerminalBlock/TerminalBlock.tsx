import React from 'react';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import './TerminalBlock.css';

interface TerminalBlockProps {
  children: React.ReactNode;
  title?: string;
  maxHeight?: number;
}

const TerminalBlock = React.memo<TerminalBlockProps>(({ children, title, maxHeight = 300 }) => {
  return (
    <div className="ncc-terminal-block" style={{
      backgroundColor: colors.bg.primary,
      borderRadius: radius.md,
      border: `1px solid ${colors.border.subtle}`,
      overflow: 'hidden',
    }}>
      {title && (
        <div className="ncc-terminal-header" style={{
          padding: `${spacing.xs}px ${spacing.md}px`,
          borderBottom: `1px solid ${colors.border.subtle}`,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
        }}>
          <div className="ncc-terminal-dots">
            <span style={{ backgroundColor: colors.accent.red }} />
            <span style={{ backgroundColor: colors.accent.amber }} />
            <span style={{ backgroundColor: colors.accent.green }} />
          </div>
          <span style={{
            fontFamily: typography.monoSm.fontFamily,
            fontSize: typography.monoSm.fontSize,
            color: colors.text.muted,
          }}>
            {title}
          </span>
        </div>
      )}
      <div style={{
        padding: spacing.md,
        fontFamily: typography.mono.fontFamily,
        fontSize: typography.mono.fontSize,
        color: colors.accent.violet,
        maxHeight,
        overflowY: 'auto',
        lineHeight: 1.6,
      }}>
        {children}
      </div>
    </div>
  );
});

TerminalBlock.displayName = 'TerminalBlock';
export default TerminalBlock;
