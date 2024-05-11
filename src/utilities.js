export const drawRect = (detections, ctx)=>{
    detections.forEach(prediction=>{
        const [x,y,width,height] = prediction['bbox'];
        const text =prediction['class']+" Score: "+(prediction['score'] * 100).toFixed(2)+"% dis: "+prediction['distance'];

        const color = "blue"
        ctx.strokeStyle = color;
        ctx.font = "18px Arial"
        ctx.fillStyle = color

        ctx.beginPath();
        ctx.fillText(text, x,y)
        ctx.rect(x,y,width, height);
        ctx.stroke()
    })
}