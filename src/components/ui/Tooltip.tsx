import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  label: string;
  children: React.ReactElement;
  placement?: 'top' | 'bottom';
}

const HOVER_DELAY_MS = 150;
const FLIP_MARGIN_PX = 8;

type Coords = { top: number; left: number; placement: 'top' | 'bottom' };

/**
 * Hover/focus tooltip for a single trigger element. The wrapper `<span>`,
 * not the trigger, carries the pointer handlers: a disabled `<button>`
 * swallows mouse events in Firefox, so the trigger alone would never show a
 * tooltip on a disabled action.
 */
const Tooltip: React.FC<TooltipProps> = ({ label, children, placement = 'top' }) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearShowTimer = () => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  };

  const measure = () => {
    const trigger = wrapperRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const tooltipHeight = tooltipRef.current?.offsetHeight ?? 0;
    const flips = placement === 'top' && rect.top < tooltipHeight + FLIP_MARGIN_PX;
    const resolved: 'top' | 'bottom' = flips ? 'bottom' : placement;
    const top = resolved === 'top' ? rect.top - FLIP_MARGIN_PX : rect.bottom + FLIP_MARGIN_PX;
    const left = rect.left + rect.width / 2;
    setCoords({ top, left, placement: resolved });
  };

  useLayoutEffect(() => {
    if (visible) measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => clearShowTimer, []);

  useEffect(() => {
    if (!visible) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearShowTimer();
        setVisible(false);
      }
    };
    // Coordinates are measured once on show; a scroll (the grids scroll
    // sideways on wheel) would leave the fixed tooltip stranded, so hide.
    const onScroll = () => setVisible(false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [visible]);

  const showOnHover = () => {
    clearShowTimer();
    showTimerRef.current = setTimeout(() => setVisible(true), HOVER_DELAY_MS);
  };

  const showOnFocus = () => {
    clearShowTimer();
    setVisible(true);
  };

  const hide = () => {
    clearShowTimer();
    setVisible(false);
  };

  const resolvedPlacement = coords?.placement ?? placement;

  return (
    <span
      ref={wrapperRef}
      className="inline-flex"
      onMouseEnter={showOnHover}
      onMouseLeave={hide}
      onFocus={showOnFocus}
      onBlur={hide}
    >
      {children}
      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            aria-hidden="true"
            className="gd-tip"
            style={{
              position: 'fixed',
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              transform:
                resolvedPlacement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            }}
          >
            {label}
          </div>,
          document.body
        )}
    </span>
  );
};

export default Tooltip;
