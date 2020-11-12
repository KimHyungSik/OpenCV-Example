let width=480, height=640;
const video = document.getElementById("video");
const canvas = document.getElementById('output');
canvas.width = width;
canvas.height = height;
const constraints = {
    video: true, audio: false
};

function setSize() {
    if (window.orientation == 0) {
        //portrait
        width = 480; height = 640;
    }
    else {
        //landscape
        width = 640; height = 480;
    }
}


function StartVidoe(){
    navigator.getUserMedia(constraints, (stream) =>{
        video.width = width; 
        video.height = height;
        video.srcObject = stream;
        video.play();
    }, () => console.log("error"));
}

let src, dist, hsv, cap, dst, hsvs;
let low, high, lower, upper;


function OpenCv() {
    lower = new cv.Scalar(0, 133, 77);
    upper = new cv.Scalar(255,173,127);
    hsv = new cv.Mat(height, width, cv.CV_8UC3);
    src = new cv.Mat(height, width, cv.CV_8UC4);
    dist = new cv.Mat(height, width, cv.CV_8UC1);
    cap = new cv.VideoCapture('video');
    setTimeout(process, 33);
}

function process() {
    cap.read(src);
    hsvs = new cv.Mat();
    dst = new cv.Mat();

    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsvs, cv.COLOR_RGB2HSV);

    low = new cv.Mat(height, width, hsvs.type(), lower);
    high = new cv.Mat(height, width, hsvs.type(), upper);

    cv.inRange(hsvs, low, high, dst);
    cv.imshow('output', dst);
    setTimeout(process, 33);
}

StartVidoe();