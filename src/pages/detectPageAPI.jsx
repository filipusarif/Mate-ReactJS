import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

function App() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [detections, setDetections] = useState([]);
    const [story, setStory] = useState('');
    const [isFrontCamera, setIsFrontCamera] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isActive, setIsActive] = useState(true);
    const requestRef = useRef(null);
    const hasSpokenRef = useRef(false);
    const typingSpeed = 80;

    const recognitionRef = useRef(null);
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');

    // Change Camera Function
    const switchCamera = () => {
        setIsFrontCamera(!isFrontCamera);
    };

    const constraints = {
        video: {
            facingMode: isFrontCamera ? "user" : "environment"
        }
    };

    useEffect(() => {
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
            videoRef.current.srcObject = stream;
            setIsLoading(false); 
        }).catch((error) => {
            console.error('Error accessing camera:', error);
            setIsLoading(false); 
        });
    }, [isFrontCamera]);

    useEffect(() => {
        if (!isLoading && !hasSpokenRef.current) {
            speakStory('Anda berada di halaman deteksi');
            hasSpokenRef.current = true;
        }
    }, [isLoading]);

    useEffect(() => {
        if (story) {
            speakStory(story);
        }
    }, [story]);

    const sendFrame = async () => {
        if (!isActive) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('file', blob, 'frame.jpg');

            try {
                const response = await axios.post('http://127.0.0.1:8000/detect/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                setDetections(response.data.detections);
                setStory(response.data.story);
                drawDetections(response.data.detections, context);
                console.log(response.data.detections);
            } catch (error) {
                console.error('Error uploading frame:', error);
            }
        }, 'image/jpeg');
        requestRef.current = setTimeout(sendFrame, 15000); 
    };

    useEffect(() => {
        if (isActive) {
            requestRef.current = setTimeout(sendFrame, 15000); 
        } else {
            clearTimeout(requestRef.current); 
        }
        return () => clearTimeout(requestRef.current); 
    }, [isActive]);

    const speakStory = (text) => {
        if (isActive) {
            const speech = new SpeechSynthesisUtterance(text);
            speech.lang = 'id-ID';
            speech.pitch = 1;
            speech.rate = 0.8;
            window.speechSynthesis.speak(speech);
        }
    };

    const toggleFunctions = () => {
        setIsActive(!isActive);
        if (isActive) {
            window.speechSynthesis.cancel();
            startRecognition();
        } else {
            stopRecognition();
        }
    };

    const startRecognition = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Speech Recognition API not supported in this browser.');
            return;
        }

        recognitionRef.current = new window.webkitSpeechRecognition();
        recognitionRef.current.lang = 'id-ID';
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onstart = () => {
            setIsRecognizing(true);
        };

        recognitionRef.current.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('Recognized text:', transcript);
            setRecognizedText(transcript);
        };

        recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error', event.error);
        };

        recognitionRef.current.onend = () => {
            setIsRecognizing(false);
        };

        recognitionRef.current.start();
    };

    const stopRecognition = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
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
            {isLoading ? (
                <div className="loading">
                    <p>Loading...</p>
                    {/* Add any loading animation here */}
                </div>
            ) : (
                <>
                    <h1>Object Detection</h1>
                    <video ref={videoRef} autoPlay width="640" height="480"></video>
                    <button onClick={switchCamera} className='bg-blue-500 text-white px-5 py-3 rounded-lg'>Switch Camera</button>
                    <button onClick={toggleFunctions} className='bg-green-500 text-white px-5 py-3 rounded-lg'>{isActive ? 'Stop' : 'Start'}</button>
                    <div>
                        <h2>Story:</h2>
                        <Typewriter text={story} delay={typingSpeed} />
                    </div>
                    <canvas ref={canvasRef} width="640" height="480" style={{ display:'none' }}></canvas>
                    {isRecognizing && <p>Listening...</p>}
                    <p>Recognized Text: {recognizedText}</p> 
                </>
            )}
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
