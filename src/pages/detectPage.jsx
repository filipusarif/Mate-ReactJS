import React, { useRef, useEffect, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
import Webcam from 'react-webcam';
import { drawRect } from '../utilities';

export default function Index() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);

    const [isFrontCamera, setIsFrontCamera] = useState(true);

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
        }, 1);
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
        
            // Set canvas height and width
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;
        
            const obj = await net.detect(video);
            
            // Draw mesh
            const ctx = canvasRef.current.getContext("2d");
                
            // Count and save distance each object
            const detectionsWithDistance = obj.map(objItem => {
                const objectWidth = objItem.bbox[2]; // assuming first object
                const focalLength = 1000; // focal length
                const realWidth = 20; //lebar asli
                const calculatedDistance = (focalLength * realWidth) / objectWidth;

                return {
                    ...objItem,
                    distance: calculatedDistance.toFixed(2)
                };
            });

            // Draw Stroke/line and distance
            drawRect(detectionsWithDistance, ctx);
        }
    };

    useEffect(()=>{runCoco()},[]);

    return (
        <section className="min-h-screen w-screen flex flex-col justify-center items-center gap-3">
            <Webcam
            ref={webcamRef}
            muted={true} 
            style={{
                position: "relative",
                marginLeft: "auto",
                marginRight: "auto",
                left: 0,
                right: 0,
                textAlign: "center",
                zindex: 9,
                width: 640,
                height: 480,
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
                width: 640,
                height: 480,
            }}
            />
            <button onClick={switchCamera} className='bg-blue-500 text-white px-5 py-3 rounded-lg'>Switch Camera</button>
        </section>
    );
}
