import React, { useEffect, useRef } from 'react';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, radius } from '../../constants/spacing';
import './TerminalBlock.css';

interface TerminalBlockProps {
  children: React.ReactNode;
  title?: string;
  maxHeight?: number;
  isActive?: boolean;
}

const TerminalBlock = React.memo<TerminalBlockProps>(({ children, title, maxHeight = 300, isActive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let offset = 0;

    const resizeCanvas = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth * 0.5 || 220;
        canvas.height = 36;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      // 1. Draw delicate grid indicators
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 0.8;
      for (let x = 10; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // 2. Draw glowing primary violet wave (bandwidth signal)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.7)'; // Violet
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(139, 92, 246, 0.8)';

      for (let x = 0; x < width; x++) {
        const angle1 = (x * 0.022) + offset;
        const angle2 = (x * 0.045) - offset * 1.3;
        const amp = isActive ? (8 + Math.sin(offset * 2.2) * 2.5) : 1.5;
        const y = midY + Math.sin(angle1) * amp + Math.cos(angle2) * (amp * 0.25);
        
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 3. Draw secondary cyan wave (telemetry)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.38)'; // Cyan
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 3;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';

      for (let x = 0; x < width; x++) {
        const angle1 = (x * 0.03) - offset * 0.9;
        const angle2 = (x * 0.015) + offset * 0.6;
        const amp = isActive ? (5 + Math.cos(offset * 1.5) * 1.8) : 1.0;
        const y = midY + Math.sin(angle1) * amp + Math.sin(angle2) * (amp * 0.3);
        
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Reset shadows
      ctx.shadowBlur = 0;

      offset += isActive ? 0.08 : 0.012;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isActive]);

  return (
    <div className="ncc-terminal-block obsidian-slate-panel" style={{
      backgroundColor: '#090D1A',
      borderRadius: radius.lg,
      border: `1px solid rgba(255, 255, 255, 0.08)`,
      overflow: 'hidden',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {title && (
        <div className="ncc-terminal-header" style={{
          padding: `12px 16px`,
          borderBottom: `1px solid rgba(255, 255, 255, 0.06)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <div className="ncc-terminal-dots">
              <span style={{ backgroundColor: '#EF4444' }} />
              <span style={{ backgroundColor: '#F59E0B' }} />
              <span style={{ backgroundColor: '#10B981' }} />
            </div>
            <span style={{
              fontFamily: typography.monoSm.fontFamily,
              fontSize: typography.monoSm.fontSize,
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.45)',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
            }}>
              {title}
            </span>
          </div>
          <span style={{
            fontFamily: typography.monoSm.fontFamily,
            fontSize: '9px',
            color: 'rgba(109, 40, 217, 0.75)',
            background: 'rgba(109, 40, 217, 0.08)',
            padding: '2px 8px',
            border: '1px solid rgba(109, 40, 217, 0.15)',
            borderRadius: '4px',
          }}>
            SECURE SHELL v2
          </span>
        </div>
      )}
      <div className="terminal-scroller" style={{
        padding: spacing.md,
        fontFamily: typography.mono.fontFamily,
        fontSize: '12px',
        color: '#A78BFA',
        maxHeight,
        overflowY: 'auto',
        lineHeight: 1.7,
        flex: 1,
      }}>
        {children}
      </div>

      {/* Premium Cognitive Token Bandwidth Wave Canvas Footer */}
      <div className="terminal-wave-footer" style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(5, 8, 18, 0.65)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
        minHeight: '48px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontFamily: typography.monoSm.fontFamily,
            fontSize: '8px',
            color: 'rgba(255, 255, 255, 0.3)',
            letterSpacing: '0.8px'
          }}>COGNITIVE stream bandwidth</span>
          <span style={{
            fontFamily: typography.monoBold.fontFamily,
            fontSize: '11px',
            color: colors.accent.cyan,
            fontWeight: 700,
            letterSpacing: '0.5px'
          }}>
            {isActive ? '64.8 TOKENS/SEC' : '0.0 TOKENS/SEC // IDLE'}
          </span>
        </div>
        <canvas ref={canvasRef} style={{ height: 28, width: '45%', display: 'block', opacity: 0.8 }} />
      </div>
    </div>
  );
});

TerminalBlock.displayName = 'TerminalBlock';
export default TerminalBlock;
