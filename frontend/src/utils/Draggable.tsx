import { useEffect, useState } from "react";

interface DraggableProps {
  targetRef: React.RefObject<HTMLElement> | React.RefObject<SVGElement>;
  setOffsetScale: (offsetScale: { offset: { x: number; y: number }; scale: number }) => void;
  startOffset?: { x: number; y: number };
  startScale?: number;
}

const Draggable = (props: DraggableProps) => {
  const { targetRef, startOffset = { x: 0, y: 0 }, startScale = 100, setOffsetScale: setOrigOffsetScale } = props;
  const [{ offset, scale }, setOffsetScale] = useState({ offset: startOffset, scale: startScale });

  useEffect(() => {
    setOrigOffsetScale({ offset, scale });
  }, [targetRef, offset, scale, setOrigOffsetScale]);

  useEffect(() => {
    const target = targetRef.current;
    const listenerMM = (e: MouseEvent) => {
      if (e.buttons === 1) {
        if (target && target.parentElement) {
          // const parent = target.parentElement as unknown as HTMLElement;
          const parent = target;
          const width = parent.clientWidth;
          const height = parent.clientHeight;
          const viewBox = parent.getAttribute("viewBox") || `0 0 ${parent.clientWidth} ${parent.clientHeight}`;

          const [x1, y1, x2, y2] = viewBox.split(" ").map(Number);
          const scaleMov = Math.max((x2 - x1) / width, (y2 - y1) / height);

          setOffsetScale(({ offset, scale }) => ({
            offset: {
              x: offset.x + e.movementX * scaleMov,
              y: offset.y + e.movementY * scaleMov,
            },
            scale,
          }));
        }
      }
    };
    const listenerWh = (e: WheelEvent) => {
      if (target && target.parentElement) {
        // const parent = target.parentElement as unknown as HTMLElement;
        const parent = target;
        const boundingRect = parent.getBoundingClientRect();
        const viewBox = parent.getAttribute("viewBox") || `0 0 ${parent.clientWidth} ${parent.clientHeight}`;
        const viewBoxParts = viewBox.split(" ").map(Number);
        const [x1, y1, x2, y2] = viewBoxParts;
        const scaleMov = Math.max((x2 - x1) / boundingRect.width, (y2 - y1) / boundingRect.height);
        const viewBoxWidth = (x2 - x1) / scaleMov;
        const viewBoxHeight = (y2 - y1) / scaleMov;

        const extraWidth = (boundingRect.width - viewBoxWidth) / 2 + 0;
        const extraHeight = (boundingRect.height - viewBoxHeight) / 2 + 0;

        const x = e.clientX - boundingRect.left - 0; //x position within the element.
        const y = e.clientY - boundingRect.top - 0; //y position within the element.

        const scaleBy = 1.5;
        const scaleDiff = e.deltaY > 0 ? 1 / scaleBy : 1 * scaleBy;

        setOffsetScale(({ offset, scale }) => {
          const diffX = x - (extraWidth + offset.x);
          const diffY = y - (extraHeight + offset.y);
          return {
            offset: {
              x: offset.x + diffX - diffX * scaleDiff,
              y: offset.y + diffY - diffY * scaleDiff,
            },
            scale: scale * scaleDiff,
          };
        });
      }
    };
    if (target) {
      target.addEventListener("mousemove", listenerMM as unknown as EventListener);
      target.addEventListener("wheel", listenerWh as unknown as EventListener);
    }
    return () => {
      if (target) {
        target.removeEventListener("mousemove", listenerMM as unknown as EventListener);
        target.removeEventListener("wheel", listenerWh as unknown as EventListener);
      }
    };
  }, [targetRef]);
  return null;
};

export default Draggable;