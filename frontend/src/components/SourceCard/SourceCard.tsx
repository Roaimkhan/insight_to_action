import React from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import { PdfIcon, CsvIcon, WebIcon, TableIcon, RealtimeIcon } from '../Icons/Icons';
import Badge from '../Badge/Badge';
import CredibilityBar from '../CredibilityBar/CredibilityBar';
import type { DataSource } from '../../types/agent';
import './SourceCard.css';

interface SourceCardProps {
  source: DataSource;
  animationDelay?: number;
  isLoading?: boolean;
}

const iconMap: Record<string, React.FC<{ size?: number; color?: string }>> = {
  pdf: PdfIcon,
  csv: CsvIcon,
  web: WebIcon,
  table: TableIcon,
  realtime: RealtimeIcon,
};

const freshnessVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  fresh: 'success',
  stale: 'warning',
  expired: 'danger',
};

const SourceCard = React.memo<SourceCardProps>(({ source, animationDelay = 0, isLoading = false }) => {
  if (isLoading) {
    return (
      <motion.div
        className="ncc-source-card ncc-source-card--loading"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: animationDelay * 0.001, duration: 0.3, type: 'spring', damping: 20, stiffness: 180 }}
      >
        <div className="shimmer" style={{ height: 20, width: '60%', borderRadius: radius.sm, marginBottom: spacing.sm }} />
        <div className="shimmer" style={{ height: 14, width: '40%', borderRadius: radius.sm, marginBottom: spacing.md }} />
        <div className="shimmer" style={{ height: 6, width: '100%', borderRadius: radius.full }} />
      </motion.div>
    );
  }

  const IconComp = iconMap[source.source_type] || PdfIcon;
  const isStale = source.freshness === 'stale' || source.freshness === 'expired';

  return (
    <motion.div
      className={`ncc-source-card ${isStale ? 'ncc-source-card--stale' : ''}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay * 0.001, duration: 0.3, type: 'spring', damping: 20, stiffness: 180 }}
    >
      <div className="ncc-source-card__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flex: 1, minWidth: 0 }}>
          <IconComp size={20} color={isStale ? colors.accent.amber : colors.accent.cyan} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: typography.h3.fontFamily,
              fontSize: typography.h3.fontSize,
              fontWeight: typography.h3.fontWeight,
              color: colors.text.primary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {source.label || source.source_id}
            </div>
            <div style={{
              fontFamily: typography.monoSm.fontFamily,
              fontSize: typography.monoSm.fontSize,
              color: colors.text.muted,
              marginTop: 2,
            }}>
              {source.source_type.toUpperCase()} · {source.source_id}
            </div>
          </div>
        </div>
        <Badge
          label={source.freshness.toUpperCase()}
          variant={freshnessVariant[source.freshness]}
        />
      </div>
      <div style={{ marginTop: spacing.sm }}>
        <CredibilityBar
          score={source.credibility_score}
          label="Credibility"
          height={4}
        />
      </div>
    </motion.div>
  );
});

SourceCard.displayName = 'SourceCard';
export default SourceCard;
