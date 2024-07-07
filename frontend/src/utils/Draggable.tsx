import { useEffect, useState } from "react";

interface DraggableProps {
  targetRef: React.RefObject<SVGGElement>;
  startOffset?: { x: number; y: number };
  startScale?: number;
}

const Draggable = (props: DraggableProps) => {
  const { targetRef, startOffset = { x: 0, y: 0 }, startScale = 100 } = props;
  const [{ offset, scale }, setOffsetScale] = useState({ offset: startOffset, scale: startScale });

  useEffect(() => {
    if (targetRef.current) {
      targetRef.current.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${scale}%)`;
    }
  }, [targetRef, offset, scale]);

  useEffect(() => {
    const target = targetRef.current;
    const listenerMM = (e: MouseEvent) => {
      if (e.buttons === 1) {
        if (targetRef.current && targetRef.current.parentElement) {
          const parent = targetRef.current.parentElement as unknown as SVGElement;
          const width = parent.clientWidth;
          const height = parent.clientHeight;
          const viewBox = parent.getAttribute("viewBox") as string;
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
      const parent = (e.currentTarget as unknown as SVGElement).parentElement as unknown as SVGElement;
      const boundingRect = parent.getBoundingClientRect();
      const viewBox = parent.getAttribute("viewBox") as string;
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
    };
    if (target) {
      target.addEventListener("mousemove", listenerMM);
      target.addEventListener("wheel", listenerWh);
    }
    return () => {
      if (target) {
        target.removeEventListener("mousemove", listenerMM);
        target.removeEventListener("wheel", listenerWh);
      }
    };
  }, [targetRef]);
  return null;
};

export default Draggable;