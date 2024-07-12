import React, { useRef, useEffect } from 'react';

const CameraComponent = ({ setCanvasRef, sendFrame }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const constraints = {
      video: true,
    };

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      videoRef.current.srcObject = stream;
    });

    const intervalId = setInterval(() => {
      sendFrame();
    }, 1000); // Kirim frame setiap detik

    return () => clearInterval(intervalId);
  }, [sendFrame]);

  return (
    <div>
      <video ref={videoRef} autoPlay width="640" height="480"></video>
      <canvas ref={setCanvasRef} width="640" height="480" style={{ display: 'none' }}></canvas>
    </div>
  );
};

export default CameraComponent;
