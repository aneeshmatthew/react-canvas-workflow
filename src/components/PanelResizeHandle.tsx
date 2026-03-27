import { useCallback, useRef } from "react";

type Props = {
  /** Called with horizontal delta in pixels (positive = drag to the right). */
  onResizeDelta: (deltaX: number) => void;
  ariaLabel: string;
};

/**
 * Vertical drag handle between panels (col-resize).
 */
export function PanelResizeHandle({ onResizeDelta, ariaLabel }: Props) {
  const lastX = useRef(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      lastX.current = e.clientX;
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      if (dx !== 0) onResizeDelta(dx);
    },
    [onResizeDelta],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  return (
    <div
      className="panel-resize-handle"
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  );
}
