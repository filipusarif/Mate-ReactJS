import React, { useRef, useEffect, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
import Webcam from 'react-webcam';
import { drawRect } from '../utilities';

export default function Index() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);


    const [isFrontCamera, setIsFrontCamera] = useState(false);
    const [audioStatus, setAudioStatus] = useState(true);
    const [widthCam, setWidthCam] = useState(null);
    const [heighCam, setHeighCam] = useState(null);
    const [objectTarget, setObjectTarget] = useState(null);
    let count=0;


    let tempObj = 0;


    // Change Camera Function
    const switchCamera = () => {
        setIsFrontCamera(!isFrontCamera);
    };

    const videoConstraints = {
        facingMode: isFrontCamera ? "user" : "environment"
    };

    // Main function
    const runCoco = async () => {
        const net = await cocoSsd.load();
        console.log("Dataset Load");
        //  Detect Object
        setInterval(() => {
            detect(net);
        }, 100);
    };


    const detect = async (net) => {
        // Check data is available
        if (
        typeof webcamRef.current !== "undefined" &&
        webcamRef.current !== null &&
        webcamRef.current.video.readyState === 4
        ) {
            // Get Video Properties
            const video = webcamRef.current.video;
            const videoWidth = webcamRef.current.video.videoWidth;
            const videoHeight = webcamRef.current.video.videoHeight;
        
            // Set video width
            webcamRef.current.video.width = videoWidth;
            webcamRef.current.video.height = videoHeight;
            setHeighCam(videoHeight);
            setWidthCam(videoWidth);

            // Set canvas height and width
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;
        
            const obj = await net.detect(video);
            
            // Draw mesh
            const ctx = canvasRef.current.getContext("2d");
                
            let calculatedDistance;
            let object=0;

            // Count and save distance each object
            const detectionsWithDistance = obj.map(objItem => {
                const objectWidth = objItem.bbox[2]; // assuming first object
                const focalLength = 1000; // focal length
                const realWidth = 20; //lebar asli
                calculatedDistance = (focalLength * realWidth) / objectWidth;
                
                object++;
                
                return {
                    ...objItem,
                    distance: calculatedDistance.toFixed(2)
                };
            });

            
                if(tempObj != object && count % 50 == 0){
                    
                    tempObj = object;
                    if(audioStatus){
                        audio(calculatedDistance.toFixed(2));
                        console.log(object)
                        console.log(tempObj)
                    }else{
                        speechSynthesis.cancel();
                    }
                    
                }else{
                    if(!audioStatus){
                        speechSynthesis.cancel();
                    }
                }
            

            count++;
            // Draw Stroke/line and distance
            drawRect(detectionsWithDistance, ctx);
        }
    };

    useEffect(()=>{runCoco()},[]);


    function activeSound() {
        setAudioStatus(true);
    }

    function nonActiveSound() {
        setAudioStatus(false);
        speechSynthesis.cancel();
    }

    const audio = (distance) => {
        var speechSynthesis = window.speechSynthesis;
        var speech = new SpeechSynthesisUtterance();
            // Set the text to be spoken
            speech.text = "didepan object orang jarak "+distance;
            speech.lang = 'id-ID';
            // Use the default speech synthesizer
            var speechSynthesis = window.speechSynthesis;
            speechSynthesis.speak(speech);
    }

    

    return (
        <section className="min-h-screen w-screen overflow-x-hidden bg-slate-500">
            <main className='container flex flex-col justify-center items-center gap-3 mx-auto'>
                <div className={`w-[${widthCam}px] h-[${heighCam}] overflow-hidden flex flex-col justify-center items-center relative`}>
                    <Webcam
                    ref={webcamRef}
                    muted={true}
                    style={{
                        marginLeft: "auto",
                        marginRight: "auto",
                        textAlign: "center",
                        zindex: 9,
                        width: widthCam,
                        height: heighCam,
                    }}
                    videoConstraints={videoConstraints}
                    />
                    <canvas
                    ref={canvasRef}
                    style={{
                        position: "absolute",
                        marginLeft: "auto",
                        marginRight: "auto",
                        left: 0,
                        right: 0,
                        textAlign: "center",
                        zindex: 8,
                        
                    }}
                    className=" w-full h-full"
                    />
                </div>
                <button onClick={switchCamera} className='bg-blue-500 text-white px-5 py-3 rounded-lg'>Switch Camera</button>
                <button onClick={activeSound}>Audio On</button>
                <button onClick={nonActiveSound}>Audio Off</button>
            </main>
        </section>
    );
}
