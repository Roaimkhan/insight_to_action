import React, { useCallback } from 'react';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import Badge from '../Badge/Badge';
import './NodeBadge.css';

interface NodeBadgeProps {
  node: string | null;
  elapsedMs: number;
}

const NodeBadge = React.memo<NodeBadgeProps>(({ node, elapsedMs }) => {
  const formatTime = useCallback((ms: number) => {
    const totalSec = ms / 1000;
    const min = Math.floor(totalSec / 60);
    const sec = (totalSec % 60).toFixed(1);
    return `${min}:${sec.padStart(4, '0')}s`;
  }, []);

  if (!node) return null;

  return (
    <div className="ncc-node-badge">
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <span style={{
          fontFamily: typography.label.fontFamily,
          fontSize: typography.label.fontSize,
          fontWeight: typography.label.fontWeight,
          letterSpacing: typography.label.letterSpacing,
          textTransform: typography.label.textTransform,
          color: colors.text.muted,
        }}>
          NODE:
        </span>
        <Badge label={node.toUpperCase()} variant="info" />
      </div>
      <span style={{
        fontFamily: typography.mono.fontFamily,
        fontSize: typography.mono.fontSize,
        color: colors.accent.cyan,
        fontWeight: 700
      }}>
        {formatTime(elapsedMs)}
      </span>
    </div>
  );
});

NodeBadge.displayName = 'NodeBadge';
export default NodeBadge;
