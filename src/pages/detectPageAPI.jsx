import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, useMap, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Komponen untuk menemukan lokasi saat ini
function LocateUser() {
    const map = useMap();

    useEffect(() => {
        map.locate({
            setView: true,    // Mengatur peta untuk fokus ke posisi pengguna
            maxZoom: 18,      // Mengatur zoom maksimal lebih dekat
            enableHighAccuracy: true, // Meminta akurasi tinggi
        });

        // Event listener untuk lokasi ditemukan
        map.on('locationfound', (e) => {
            const radius = e.accuracy; // Mendapatkan radius akurasi posisi

            // Menambahkan Marker atau Circle untuk menunjukkan lokasi
            L.marker(e.latlng).addTo(map)
                .bindPopup(`You are within ${radius.toFixed(1)} meters from this point`).openPopup();

            L.circle(e.latlng, { radius }).addTo(map); // Menambahkan lingkaran untuk akurasi
        });

        // Event listener untuk lokasi tidak ditemukan
        map.on('locationerror', () => {
            alert("Location access denied.");
        });
    }, [map]);

    return null; // Tidak perlu render apa-apa karena hanya untuk fungsi
}

function App() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [detections, setDetections] = useState([]);
    const [story, setStory] = useState([]);
    const [isFrontCamera, setIsFrontCamera] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isActive, setIsActive] = useState(true);
    const requestRef = useRef(null);
    const hasSpokenRef = useRef(false);
    const typingSpeed = 80;
    const api = 'http://127.0.0.1:8000/detect/';
    const recognitionRef = useRef(null);
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');
    const messagesEndRef = useRef(null);

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
    }, []);

    useEffect(() => {
        if (!isLoading && !hasSpokenRef.current) {
            speakStory('Anda berada di halaman deteksi');
            hasSpokenRef.current = true;
        }
    }, [isLoading]);

    useEffect(() => {
        if (story.length > 0) {
            speakStory(story[story.length - 1].text);
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
                const response = await axios.post(api, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                setDetections(response.data.detections);
                addChat(response.data.story, "system");
                drawDetections(response.data.detections, context);
                console.log(response.data.detections);
            } catch (error) {
                console.error('Error uploading frame:', error);
            }
        }, 'image/jpeg');
        requestRef.current = setTimeout(sendFrame, 15000); 
    };

    const addChat = (chat, type) => {
        setStory(prevStory => {
            // Check if the last message is from the same type
            if (prevStory.length > 0 && prevStory[prevStory.length - 1].type === type) {
                const updatedStory = [...prevStory];
                updatedStory[updatedStory.length - 1].text = chat;
                return updatedStory;
            } else {
                return [...prevStory, { text: chat, type }];
            }
        });
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
            handleCommand(transcript);
            addChat(transcript, "user");
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

    const handleCommand = (command) => {
        if (command.toLowerCase().startsWith('mate')) {
            const action = command.slice(5).trim().toLowerCase();
            if (action === 'pindah halaman') {
                // Contoh: Pindah ke halaman lain
                window.location.href = 'https://example.com'; // Ganti dengan URL tujuan
            }
        } else if (command.toLowerCase().startsWith('cari')) {
            const action = command.slice(5).trim().toLowerCase();

            // Lakukan pencarian Google atau tugas lain
            searchGoogle(action);
        } else {
            // chat bot
            // chat(command)
        }
    };

    const searchGoogle = async (query) => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/search/`, {
                params: {
                    query: query
                }
            });
            const { answer } = response.data;
            if (answer) {
                speakStory(`Saya menemukan ini di Google: ${answer}.`);
                console.log(answer);
            } else {
                speakStory('Maaf, saya tidak menemukan informasi yang relevan.');
            }
        } catch (error) {
            console.error('Error during Google search:', error);
            speakStory('Maaf, terjadi kesalahan saat melakukan pencarian.');
        }
    };
    const chat = async (message) => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/chat/`, {
                params: {
                    message: message
                }
            });
            const { answer } = response.data;
            speakStory(`Saya menemukan ini di Google: ${answer}.`);
        } catch (error) {
            console.error('Error during Google search:', error);
            speakStory('Chat tidak dikenal');
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

    useEffect(() => {
        // Scroll to bottom whenever messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [story]);

    const [menu, setMenu] = useState(true);
    
    const toDetectionMenu =() =>{
        setMenu(true);
    }

    const toNavigationMenu = () => {
        setMenu(false);
    }
    return (
        <div className="App">
            {isLoading ? (
                <div className="loading">
                    <p>Loading...</p>
                </div>
            ) : (
                <div>
                <main className='block relative md:hidden'>
                    <menu className=' bg-blue-500 w-full fixed h-[50px] flex justify-center gap-5 text-white '>
                        <button className=' cursor-pointer' onClick={toDetectionMenu}>detection</button>
                        <button className='cursor-pointer' onClick={toNavigationMenu}>navigation</button>
                    </menu>
                    <div className="container pt-12  w-full h-screen">
                        {menu ? 
                        <div className='bg-gray-200'>
                            <video ref={videoRef} autoPlay playsInline  width="full" height="full" className='bg-red-500'></video>
                        </div>
                        :
                        <div>
                            <MapContainer 
                                center={[51.505, -0.09]} 
                                zoom={18} 
                                scrollWheelZoom={true} 
                                style={{ height: '60%', width: '100%' , position:'absolute',zIndex:'0'}}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <LocateUser /> 
                            </MapContainer>
                        </div>}
                        <div className='absolute bg-slate-200 w-full h-[40vh] bottom-0 rounded-t-lg flex flex-col'>
                            <div className='h-[80%] w-full'>
                                {story.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`mb-2 p-3 rounded-lg shadow ${
                                            message.type === 'system'
                                                ? 'bg-gray-300 text-left'
                                                : 'bg-blue-500 text-white text-right'
                                        }`}
                                    >
                                        <Typewriter text={message.text} delay={typingSpeed} />
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                                {isRecognizing && <div className='w-full h-full grid place-items-center'>Speak</div>}
                            </div>
                            <div className='flex justify-center gap-5 w-full'>
                                <button onClick={switchCamera} className='bg-blue-500 text-white px-5 py-3 rounded-lg'>Switch Camera</button>
                                <button onClick={toggleFunctions} className='bg-green-500 text-white px-5 py-3 rounded-lg'>{isActive ? 'Stop' : 'Start'}</button>
                            </div>
                        </div>
                    </div>
                    
                </main>
                <main className='hidden  w-full h-screen md:flex justify-between items-center'>
                    <div className='relative w-[70%] h-screen overflow-hidden'>
                        {/* <video ref={videoRef} autoPlay playsInline width="200" height="120" className='absolute left-0 m-5 rounded-md z-10'></video> */}
                        <MapContainer 
                            center={[51.505, -0.09]} 
                            zoom={18} 
                            scrollWheelZoom={true} 
                            style={{ height: '100%', width: '100%' , position:'absolute',zIndex:'0'}}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <LocateUser /> {/* Komponen untuk menemukan lokasi pengguna */}
                        </MapContainer>
                    </div>

                    <div className='w-[30%] h-screen bg-slate-200 flex flex-col items-center justify-around'>
                        <div>
                            <h2>Story:</h2>
                        </div>
                        <main className='overflow-y-auto w-full p-5'>
                            {story.map((message, index) => (
                                <div
                                    key={index}
                                    className={`mb-2 p-3 rounded-lg shadow ${
                                        message.type === 'system'
                                            ? 'bg-gray-300 text-left'
                                            : 'bg-blue-500 text-white text-right'
                                    }`}
                                >
                                    <Typewriter text={message.text} delay={typingSpeed} />
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                            {isRecognizing && <p>Listening...</p>}
                        </main>

                        <div>
                            <button onClick={switchCamera} className='bg-blue-500 text-white px-5 py-3 rounded-lg'>Switch Camera</button>
                            <button onClick={toggleFunctions} className='bg-green-500 text-white px-5 py-3 rounded-lg'>{isActive ? 'Stop' : 'Start'}</button>
                        </div>
                    </div>
                    <div>
                    </div>
                    <canvas ref={canvasRef} width="640" height="480" style={{ display:'none' }}></canvas>
                </main>
                </div>
            )}
        </div>
    );
}


const Typewriter = ({ text, delay }) => {
    const [currentText, setCurrentText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);


    const speakStory = (text) => {
        if (isActive) {
            const speech = new SpeechSynthesisUtterance(text);
            speech.lang = 'id-ID';
            speech.pitch = 1;
            speech.rate = 0.8;
            window.speechSynthesis.speak(speech);
        }
    };

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
