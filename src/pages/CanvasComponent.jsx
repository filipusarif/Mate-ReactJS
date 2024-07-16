import React from 'react';

const CanvasComponent = ({ detections, caption }) => {
  const drawDetections = (context) => {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    detections.forEach((det) => {
      context.strokeStyle = 'red';
      context.lineWidth = 2;
      context.strokeRect(det.xmin, det.ymin, det.xmax - det.xmin, det.ymax - det.ymin);
      context.font = '16px Arial';
      context.fillStyle = 'red';
      context.fillText(`${det.name} (${det.confidence.toFixed(2)})`, det.xmin, det.ymin > 10 ? det.ymin - 5 : 10);
    });
  };

  return (
    <div>
      <h2>Detections</h2>
      <canvas ref={drawDetections} width="640" height="480"></canvas>
      <p>{caption}</p>
    </div>
  );
};

export default CanvasComponent;
