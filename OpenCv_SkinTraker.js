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

//Mat
let src, dist, hsv, cap, dst, hsvs, M, anchor, Red;
//inRange
let low, high, lower, upper;
//Contour
let contours, hierarchy, hull;


function OpenCv() {
    //피부색
    lower = new cv.Scalar(0, 48, 80);
    upper = new cv.Scalar(20,255,255);

    //사용색
    Red = new cv.Scalar(255, 0, 0, 255);

    //색별 Mat
    hsv = new cv.Mat(height, width, cv.CV_8UC3);
    src = new cv.Mat(height, width, cv.CV_8UC4);
    dist = new cv.Mat(height, width, cv.CV_8UC1);
    hsvs = new cv.Mat();
    dst = new cv.Mat();
    
    //Morphological
    M = cv.Mat.ones(5, 5, cv.CV_8UC1);
    anchor = new cv.Point(-1, -1);

    //캠
    cap = new cv.VideoCapture('video');
    setTimeout(process, 33);
}

function process() {
    cap.read(src);

    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsvs, cv.COLOR_RGB2HSV);

    low = new cv.Mat(height, width, hsvs.type(), lower);
    high = new cv.Mat(height, width, hsvs.type(), upper);
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    hull = new cv.MatVector();
    cv.inRange(hsvs, low, high, dist);

    cv.dilate(dist, dst, M, anchor, 3, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

    cv.findContours(dist, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    for (let i = 0; i < contours.size(); ++i) {
        let tmp = new cv.Mat();
        let cnt = contours.get(i);
        cv.convexHull(cnt, tmp, false, true);
        hull.push_back(tmp);
        cnt.delete(); tmp.delete();
    }

    let MaxW = 0, MaxH = 0, MaxX = 0, MaxY = 0;
    for (let i = 0; i < contours.size(); ++i) {
        let rect = cv.boundingRect(contours.get(i));
        if(MaxW < rect.width && MaxH < rect.height && (rect.width * rect.height) > 16000){
            MaxW = rect.width;
            MaxH = rect.height;
            MaxX = rect.x;
            MaxY = rect.y;
        }
    }

    let point1 = new cv.Point(MaxX, MaxY);
    let point2 = new cv.Point(MaxX + MaxW, MaxY +MaxH);

    cv.rectangle(src, point1, point2, Red, 2, cv.LINE_AA, 0);

    cv.flip(src,src,1);

    cv.imshow('output', src);

    hull.delete();
    contours.delete();
    hierarchy.delete();
    low.delete();
    high.delete();

    requestAnimationFrame(process); 
}

StartVidoe();
