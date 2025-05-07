import { forwardRef, useEffect } from "react";

interface CanvasProps {
  width: number;
  height: number;
  draw: (context: CanvasRenderingContext2D, time: number) => void;
}

const Canvas = forwardRef((props: CanvasProps, canvasRef: React.Ref<HTMLCanvasElement>) => {
  const { width, height, draw } = props;
  // const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if(!canvasRef) {
      return
    }
    const canvas = (canvasRef as React.RefObject<HTMLCanvasElement>).current
    if (!canvas) {
      return
    }
    const context = canvas.getContext('2d')
    if (!context) {
      return
    }
    let animationFrameId: number
    
    const render = (time: number) => {
      draw(context, time)
      animationFrameId = window.requestAnimationFrame(render)
    }
    render(0)
    
    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [canvasRef, draw])
  
  return (
    <canvas ref={canvasRef} width={width} height={height} />
  );
})

export default Canvas;