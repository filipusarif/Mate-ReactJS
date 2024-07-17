import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [detections, setDetections] = useState([]);
    const [story, setStory] = useState('');

    useEffect(() => {
        const constraints = {
            video: true,
        };

        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
            videoRef.current.srcObject = stream;
        });

        const sendFrame = () => {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(async (blob) => {
                const formData = new FormData();
                formData.append('file', blob, 'frame.jpg');

                try {
                    // Production
                    // const response = await axios.post('https://anemone-busy-sunfish.ngrok-free.app/detect/', formData, {
                    //     headers: {
                    //         'Content-Type': 'multipart/form-data',
                    //     },
                    // });
                    
                    // Development
                    const response = await axios.post('http://127.0.0.1:8000/detect/', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                    setDetections(response.data.detections);
                    setStory(response.data.story);
                    drawDetections(response.data.detections, context);
                } catch (error) {
                    console.error('Error uploading frame:', error);
                }
            }, 'image/jpeg');
        };

        const intervalId = setInterval(sendFrame, 10000); // Send frame every second
        return () => clearInterval(intervalId);
    }, []);

    const drawDetections = (detections, context) => {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        detections.forEach(det => {
            context.strokeStyle = 'red';
            context.lineWidth = 2;
            context.strokeRect(det.xmin, det.ymin, det.xmax - det.xmin, det.ymax - det.ymin);
            context.font = '16px Arial';
            context.fillStyle = 'red';
            context.fillText(`${det.name} (${det.confidence.toFixed(2)})`, det.xmin, det.ymin > 10 ? det.ymin - 5 : 10);
        });
    };

    return (
        <div className="App">
            <h1>Object Detection</h1>
            <video ref={videoRef} autoPlay width="640" height="480"></video>
            <div>
                <h2>Story:</h2>
                <p>{story}</p>
            </div>
            <canvas ref={canvasRef} width="640" height="480" ></canvas>
            {/* <div>
                {detections.map((det, index) => (
                    <p key={index}>{`${det.name} (${det.confidence.toFixed(2)})`}</p>
                ))}
            </div> */}
            
        </div>
    );
}

export default App;
