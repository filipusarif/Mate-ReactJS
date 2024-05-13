import React, { useRef, useEffect, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';
import Webcam from 'react-webcam';
import { drawRect } from '../utilities';

export default function Index() {

    const webcamRef = useRef(null);
    const canvasRef = useRef(null);

    // const [detections, setDetections] = useState([]);
    const [isFrontCamera, setIsFrontCamera] = useState(true);

    const switchCamera = () => {
        setIsFrontCamera(!isFrontCamera);
    };
     // Main function
    const runCoco = async () => {
        // 3. TODO - Load network 
        // e.g. const net = await cocossd.load();
        const net = await cocoSsd.load();
        console.log("Dataset Load");
        //  deteksi 
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
    
        // 4. TODO - Make Detections
        // e.g. const obj = await net.detect(video);
        const obj = await net.detect(video);
        // console.log(obj);
        
    
        // Draw mesh
        const ctx = canvasRef.current.getContext("2d");
            
        // 5. TODO - Update drawing utility
        // drawSomething(obj, ctx)  
        // Hitung dan simpan jarak untuk setiap objek
        const detectionsWithDistance = obj.map(objItem => {
            const objectWidth = objItem.bbox[2]; // assuming first object
            const focalLength = 1000; // contoh focal length
            const realWidth = 20; // contoh lebar asli
            const calculatedDistance = (focalLength * realWidth) / objectWidth;

            return {
                ...objItem,
                distance: calculatedDistance.toFixed(2)
            };
        });
        // console.log(detectionsWithDistance)
        // setDetections(detectionsWithDistance);

        // Gambar kotak pembatas dan tampilkan jarak
        drawRect(detectionsWithDistance, ctx);

        // console.log(distance);
    }
        
    };

    useEffect(()=>{runCoco()},[]);

    const videoConstraints = {
        facingMode: isFrontCamera ? "user" : "environment" // mengganti kamera 
    };
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
