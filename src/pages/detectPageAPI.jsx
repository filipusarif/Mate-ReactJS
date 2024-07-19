import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [detections, setDetections] = useState([]);
    const [story, setStory] = useState('');
    const [isFrontCamera, setIsFrontCamera] = useState(false);
    const hasSpokenRef = useRef(false);
    const typingSpeed = 80;

    // Change Camera Function
    const switchCamera = () => {
        setIsFrontCamera(!isFrontCamera);
    };

    useEffect(() => {
        const constraints = {
            video: {
                facingMode: isFrontCamera ? "user" : "environment"
            }
        };

        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
            videoRef.current.srcObject = stream;
        }).catch((error) => {
            console.error('Error accessing camera:', error);
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
                    const response = await axios.post('https://anemone-busy-sunfish.ngrok-free.app/detect/', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                    
                    // Development
                    // const response = await axios.post('http://127.0.0.1:8000/detect/', formData, {
                    //     headers: {
                    //         'Content-Type': 'multipart/form-data',
                    //     },
                    // });
                    setDetections(response.data.detections);
                    setStory(response.data.story);
                    drawDetections(response.data.detections, context);
                    console.log(response.data.detections);
                } catch (error) {
                    console.error('Error uploading frame:', error);
                }
            }, 'image/jpeg');
        };

        const intervalId = setInterval(sendFrame, 15000); // Send frame every 10 seconds
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (!hasSpokenRef.current) {
            speakStory('Anda berada di halaman deteksi');
            hasSpokenRef.current = true;
        }
    }, []);

    useEffect(() => {
        if (story) {
            speakStory(story);
        }
    }, [story]);

    const speakStory = (text) => {
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = 'id-ID';
        speech.pitch = 1;
        speech.rate = 0.8;
        window.speechSynthesis.speak(speech);
    };

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
            <button onClick={switchCamera} className='bg-blue-500 text-white px-5 py-3 rounded-lg'>Switch Camera</button>
            <div>
                <h2>Story:</h2>
                <Typewriter text={story} delay={typingSpeed} />
            </div>
            <canvas ref={canvasRef} width="640" height="480" style={{ display:'none' }}></canvas>
        </div>
    );
}

const Typewriter = ({ text, delay }) => {
    const [currentText, setCurrentText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        setCurrentText('');
        setCurrentIndex(0);
    }, [text]);

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setCurrentText(prevText => prevText + text[currentIndex]);
                setCurrentIndex(prevIndex => prevIndex + 1);
            }, delay);

            return () => clearTimeout(timeout);
        }
    }, [currentIndex, delay, text]);

    return <span>{currentText}</span>;
};

export default App;
