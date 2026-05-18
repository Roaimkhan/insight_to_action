import React from 'react';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import Badge from '../Badge/Badge';

interface SectionHeaderProps {
  title: string;
  badge?: string;
  badgeVariant?: 'info' | 'success' | 'warning' | 'danger' | 'thinking' | 'fallback' | 'neutral';
  accentColor?: string;
}

const SectionHeader = React.memo<SectionHeaderProps>(({
  title,
  badge,
  badgeVariant = 'info',
  accentColor = colors.accent.cyan,
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: spacing.sm,
      gap: spacing.sm,
    }}>
      <div style={{
        width: 3,
        height: 16,
        backgroundColor: accentColor,
        borderRadius: 2,
        flexShrink: 0,
      }} />
      <span style={{
        fontFamily: typography.label.fontFamily,
        fontSize: typography.label.fontSize,
        fontWeight: typography.label.fontWeight,
        letterSpacing: typography.label.letterSpacing,
        textTransform: typography.label.textTransform,
        color: colors.text.secondary,
      }}>
        {title}
      </span>
      {badge && <Badge label={badge} variant={badgeVariant} />}
    </div>
  );
});

SectionHeader.displayName = 'SectionHeader';
export default SectionHeader;
