import { useRef, useEffect } from "react";
import useSize from "./useSize"; // Ensure this hook now takes a ref

const WaveForm = ({ analyzerData }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null); // Ref for the parent container
  const { dataArray, analyzer, bufferLength } = analyzerData;
  
  // Use useSize with the container ref
  const [width, height] = useSize(containerRef);

  const draw = (dataArray, analyzer, bufferLength) => {
    const canvas = canvasRef.current;
    if (!canvas || !analyzer) return;

    const canvasCtx = canvas.getContext("2d");

    const animate = () => {
      requestAnimationFrame(animate);
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
      animateBars(analyzer, canvas, canvasCtx, dataArray, bufferLength); // Draw the waveform
    };

    animate(); // Start the animation loop
  };

  useEffect(() => {
    if (analyzer) {
      draw(dataArray, analyzer, bufferLength); // Draw on analyzerData change
    }
  }, [dataArray, analyzer, bufferLength]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          zIndex: "-10", // Ensure it is in the background
        }}
      />
    </div>
  );
};

export default WaveForm;
