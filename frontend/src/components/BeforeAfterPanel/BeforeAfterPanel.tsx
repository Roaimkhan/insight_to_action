import React from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import type { MetricRow } from '../../types/agent';
import './BeforeAfterPanel.css';

interface BeforeAfterPanelProps {
  rows: MetricRow[];
}

const BeforeAfterPanel = React.memo<BeforeAfterPanelProps>(({ rows }) => {
  return (
    <div className="ncc-before-after">
      {/* Column Headers */}
      <div className="ncc-before-after__headers">
        <motion.div
          className="ncc-before-after__col-header ncc-before-after__col-header--before"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 180, delay: 0.1 }}
        >
          <span style={{
            fontFamily: typography.label.fontFamily,
            fontSize: typography.label.fontSize,
            fontWeight: typography.label.fontWeight,
            letterSpacing: typography.label.letterSpacing,
            textTransform: typography.label.textTransform,
            color: colors.text.muted,
          }}>
            BEFORE
          </span>
        </motion.div>

        <div className="ncc-before-after__divider-header" />

        <motion.div
          className="ncc-before-after__col-header ncc-before-after__col-header--after"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 180, delay: 0.1 }}
        >
          <span style={{
            fontFamily: typography.label.fontFamily,
            fontSize: typography.label.fontSize,
            fontWeight: typography.label.fontWeight,
            letterSpacing: typography.label.letterSpacing,
            textTransform: typography.label.textTransform,
            color: colors.accent.cyan,
          }}>
            AFTER
          </span>
        </motion.div>
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <motion.div
          key={row.label}
          className="ncc-before-after__row"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.06, duration: 0.3, type: 'spring', damping: 20, stiffness: 180 }}
        >
          {/* Before value */}
          <div className="ncc-before-after__cell ncc-before-after__cell--before">
            <span style={{
              fontFamily: typography.monoSm.fontFamily,
              fontSize: typography.monoSm.fontSize,
              color: colors.text.muted,
              marginBottom: 2,
            }}>
              {row.label}
            </span>
            <span style={{
              fontFamily: typography.mono.fontFamily,
              fontSize: typography.mono.fontSize,
              color: colors.text.secondary,
            }}>
              {row.before}
            </span>
          </div>

          {/* Divider */}
          <div className="ncc-before-after__divider">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M12 6l4 4-4 4" stroke={colors.text.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* After value */}
          <div className="ncc-before-after__cell ncc-before-after__cell--after">
            <span style={{
              fontFamily: typography.monoSm.fontFamily,
              fontSize: typography.monoSm.fontSize,
              color: colors.text.muted,
              marginBottom: 2,
            }}>
              {row.label}
            </span>
            <span style={{
              fontFamily: typography.mono.fontFamily,
              fontSize: typography.mono.fontSize,
              color: row.improved ? colors.accent.green : colors.accent.amber,
              fontWeight: 700,
            }}>
              {row.after}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
});

BeforeAfterPanel.displayName = 'BeforeAfterPanel';
export default BeforeAfterPanel;
