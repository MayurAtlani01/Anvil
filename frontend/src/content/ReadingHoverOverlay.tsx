import React, { useEffect, useState, useRef } from 'react';
import { BookOpen } from 'lucide-react';

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  tagName: string;
}

interface ReadingHoverOverlayProps {
  enabled: boolean;
}

export const ReadingHoverOverlay: React.FC<ReadingHoverOverlayProps> = ({ enabled }) => {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const currentElemRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      setTargetRect(null);
      currentElemRef.current = null;
      return;
    }

    const IGNORED_TAGS = new Set([
      'HTML', 'BODY', 'NAV', 'HEADER', 'FOOTER', 'BUTTON', 'INPUT', 'TEXTAREA',
      'SELECT', 'IMG', 'SVG', 'PATH', 'VIDEO', 'AUDIO', 'CANVAS', 'SCRIPT',
      'STYLE', 'NOSCRIPT', 'IFRAME', 'FORM',
    ]);

    const READABLE_TAGS = new Set([
      'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'LI', 'ARTICLE',
      'SECTION', 'PRE', 'TD', 'TH', 'FIGCAPTION', 'DD', 'DT',
    ]);

    const findReadableBlock = (el: HTMLElement | null): HTMLElement | null => {
      let curr: HTMLElement | null = el;
      while (curr && curr !== document.body && curr !== document.documentElement) {
        if (curr.id === 'anvil-learning-shadow-root' || curr.closest('#anvil-learning-shadow-root')) {
          return null;
        }

        const tag = curr.tagName.toUpperCase();

        if (IGNORED_TAGS.has(tag)) {
          return null;
        }

        if (READABLE_TAGS.has(tag)) {
          const text = curr.textContent?.trim() || '';
          if (text.length >= 8) {
            return curr;
          }
        }

        // Check for standalone text-heavy DIVs
        if (tag === 'DIV') {
          const text = curr.textContent?.trim() || '';
          // Only if it doesn't contain other nested readable block tags
          if (text.length >= 20 && !curr.querySelector('p, h1, h2, h3, h4, h5, h6, blockquote, li, article')) {
            return curr;
          }
        }

        curr = curr.parentElement;
      }
      return null;
    };

    const updateRect = () => {
      if (!currentElemRef.current) {
        setTargetRect(null);
        return;
      }
      const el = currentElemRef.current;
      const rect = el.getBoundingClientRect();

      // Only display if element is visible inside viewport
      if (rect.width > 15 && rect.height > 10 && rect.bottom > 0 && rect.top < window.innerHeight) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          tagName: el.tagName.toLowerCase(),
        });
      } else {
        setTargetRect(null);
      }
    };

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) return;
      const clientX = e.clientX;
      const clientY = e.clientY;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
        const readableBlock = findReadableBlock(el);

        if (readableBlock) {
          if (readableBlock !== currentElemRef.current) {
            currentElemRef.current = readableBlock;
            updateRect();
          }
        } else {
          if (currentElemRef.current) {
            currentElemRef.current = null;
            setTargetRect(null);
          }
        }
      });
    };

    const handleMouseLeave = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      currentElemRef.current = null;
      setTargetRect(null);
    };

    const handleScroll = () => {
      if (currentElemRef.current) {
        updateRect();
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      currentElemRef.current = null;
    };
  }, [enabled]);

  if (!enabled || !targetRect) {
    return null;
  }

  return (
    <div
      className="anvil-reading-highlight-overlay"
      style={{
        position: 'fixed',
        top: Math.max(0, targetRect.top - 3),
        left: Math.max(0, targetRect.left - 5),
        width: targetRect.width + 10,
        height: targetRect.height + 6,
        pointerEvents: 'none',
        zIndex: 2147483640,
        borderRadius: 8,
        backgroundColor: 'var(--anvil-accent-surface, rgba(var(--anvil-accent-rgb, 255, 104, 69), 0.06))',
        border: '1.5px solid var(--anvil-accent-border-active, var(--anvil-accent, rgba(255, 104, 69, 0.5)))',
        boxShadow: '0 0 16px var(--anvil-accent-glow-subtle, var(--anvil-accent-glow, rgba(255, 104, 69, 0.16)))',
        transition: 'top 100ms ease, left 100ms ease, width 100ms ease, height 100ms ease, opacity 120ms ease',
      }}
    />
  );
};
