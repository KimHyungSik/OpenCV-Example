//Video Size
let width=480, height=640;

//Html Tag
const video = document.getElementById("video");
const canvas = document.getElementById('output');
const testText = document.getElementById('testText');
const testText2 = document.getElementById('testText2');

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
let src, dist, hsv, cap, dst, hsvs, M, anchor, ksize, distTrans, fingerMat, Bsdst, BsMainMat;
//inRange
let low, high, lower, upper;
//Contour
let contours, hierarchy, hull;
//Color
let Red, Blue, Green;
//Hull
let defect, hullDefect;
//finger
let fingerContours, fingerHierarchy;
//BackGround Subtractor
let fgbg;

function OpenCv() {
    //피부색
    lower = new cv.Scalar(0, 48, 80);
    upper = new cv.Scalar(20,255,255);

    //사용색
    Red = new cv.Scalar(255, 0, 0, 255);
    Blue = new cv.Scalar(0, 0, 255, 255);
    Green = new cv.Scalar(0,255,0,255);

    //색별 Mat
    hsv = new cv.Mat(height, width, cv.CV_8UC3);
    src = new cv.Mat(height, width, cv.CV_8UC4);
    dist = new cv.Mat(height, width, cv.CV_8UC1);
    hsvs = new cv.Mat();
    dst = new cv.Mat();
 
    //Morphological 설정
    M = cv.Mat.ones(6, 6, cv.CV_8UC1);
    anchor = new cv.Point(-1, -1);

    //캠
    cap = new cv.VideoCapture('video');

    //GaussianBulr 설정
    ksize = new cv.Size(5, 5);

    fgbg = new cv.BackgroundSubtractorMOG2(500, 16, true);

    fingerMat = new cv.Mat();

    setTimeout(process, 33);
}

let centerX,centerY, moveCountX = 0, moveCountY = 0;
let tempCenterX, tempCentery;
let select = false, selectCount = 0;
let TimeChek =  Date.now();
let tempTimeChek = Date.now();
const  responsiveness = 30;
let MoevControl;
function process() {
    let MaxW = 0, MaxH = 0, MaxX = 0, MaxY = 0, countPoint = 0;
    cap.read(src);

    // 손 찾기 쉽게 변경
    cv.GaussianBlur(src, src, ksize, 0, 0, cv.BORDER_DEFAULT);

    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);

    Bsdst = new cv.Mat();
    contours = new cv.MatVector();
    findContours = new cv.MatVector();
    fingerContours = new cv.MatVector();
    fingerHierarchy = new cv.Mat();
    hierarchy = new cv.Mat();
    hull = new cv.MatVector();
    distTrans = new cv.Mat();
    BsMainMat = new cv.Mat();

    fgbg.apply(hsv, Bsdst);
    
    cv.bitwise_and(hsv, hsv, BsMainMat, Bsdst);
    cv.cvtColor(BsMainMat, hsvs, cv.COLOR_RGB2HSV);
    console.log('BMM type : ' + BsMainMat.channels());

    low = new cv.Mat(height, width, hsvs.type(), lower);
    high = new cv.Mat(height, width, hsvs.type(), upper);
    //색 추출
    cv.inRange(hsvs, low, high, dist);

    //증식, 침식
    cv.dilate(dist, dst, M, anchor, 5, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

    //경계선 찾기
    cv.findContours(dst, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    for (let i = 0; i < contours.size(); ++i) {
        let tmp = new cv.Mat();
        let cnt = contours.get(i);
        cv.convexHull(cnt, tmp, false, true);
        hull.push_back(tmp);
        cnt.delete(); tmp.delete();
    }
    

    //경계선 중 손 예측 좌표 추출
    let HandNum;
    for (let i = 0; i < contours.size(); ++i) {
        let rect = cv.boundingRect(contours.get(i));
        if(MaxW*MaxH < rect.width * rect.height && (rect.width * rect.height) > 5000){
            MaxW = rect.width;
            MaxH = rect.height;
            MaxX = rect.x;
            MaxY = rect.y;
            HandNum = i;
        }
    }

    //손가락 탐색을 위한 Roi 작업
    let rect = new cv.Rect(MaxX, MaxY, MaxW, MaxH);
    let RoiDst = new cv.Mat();
    RoiDst = dst.roi(rect);

    //거리 변환 행렬
    cv.distanceTransform(RoiDst, distTrans, cv.DIST_L2, 5);
    cv.normalize(distTrans, fingerMat, 1, 0, cv.NORM_INF);

    RoiDst.delete();

    //최고점을 찾아 손 중앙으로 인식
    let minMaxResult = cv.minMaxLoc(fingerMat);
    let radius = minMaxResult.maxVal * (MaxW + MaxH)/7;
    let handXpositon = minMaxResult.maxLoc.x + MaxX;
    let handYpositon = minMaxResult.maxLoc.y + MaxY;
    cv.circle(src, new cv.Point(handXpositon, handYpositon), radius, Green, 2);
   

    try{
    cv.drawContours(src, hull, HandNum, Red, 1, 8, hierarchy, 0);
    }catch(e){

    }

    //손 트레킹
    cv.rectangle(src, new cv.Point(MaxX, MaxY), new cv.Point(MaxX + MaxW, MaxY +MaxH), Red, 2, cv.LINE_AA, 0);

    if(TimeChek + 700 < tempTimeChek){
        console.log("go");
        testText2.innerHTML = "o";
        if(selectCount > 5){
            if(handYpositon - MaxH > radius * 1.5){
                selectCount = 0;
                MoevControl = 0;   
            }
        }
        if(handYpositon - MaxH < radius * 1.3){
            selectCount++;
        }
        console.log(select);
        tempCenterX = MaxX + (MaxW/2);
        tempCenterY = MaxY + (MaxH/2);

        //상하 좌우 중 이동량이 많은 쪽으로 결정
        if(tempCenterX < centerX - (MaxW/2)){
            MoevControl = 2;
            moveCountX = 0;
            moveCountY = 0;
        }
        if(tempCenterX > centerX+(MaxW/2)){
            MoevControl = 3;
            moveCountX = 0;
            moveCountY = 0;
        }
        if(tempCenterY < centerY - (MaxH/2)){
            MoevControl = 4;
            moveCountX = 0;
            moveCountY = 0;
        }
        if(tempCenterY > centerY + (MaxH/2)){
            MoevControl = 5;
            moveCountX = 0;
            moveCountY = 0;
        }

        switch(MoevControl){
            case 0: 
                testText.innerHTML = "Check";
                TimeChek =Date.now();
            break;
            case 1: 
            break;
            case 2: 
                testText.innerHTML = "Right";
                select = true;
                TimeChek =Date.now();
            break;
            case 3: 
                testText.innerHTML = "Left";
                select = true;
                TimeChek =Date.now();
            break;
            case 4: 
                testText.innerHTML = "Up";
                select = true;
                TimeChek =Date.now();
                break;
            case 5: 
                testText.innerHTML = "Down";
                select = true;
                TimeChek =Date.now();
            break;
        }

        centerX = MaxX + (MaxW/2);
        centerY = MaxY + (MaxH/2);
        
        tempTimeChek =Date.now();
    }else{
        console.log("stop");
        testText2.innerHTML = "x";
        MoevControl = 1;
        tempTimeChek =Date.now();
        moveCountX = 0;
        moveCountY = 0;
        selectCount = 0;
        //손 중앙점 업데이트
        centerX = MaxX + (MaxW/2);
        centerY = MaxY + (MaxH/2);
    }

    //좌우 변경
    cv.flip(src,src,1);

    //'output' 캔버스에 이미지 로딩
    cv.imshow('output', dist);

    //메모리 정리 작업
    hull.delete();
    contours.delete();
    hierarchy.delete();
    low.delete();
    high.delete();
/*     Conhull.delete();
    defect.delete(); */
    distTrans.delete();
    findContours.delete();
    fingerContours.delete();
    fingerHierarchy.delete();
    BsMainMat.delete();
    Bsdst.delete();
    //Windows에 이미지 리로딩 부탁
    requestAnimationFrame(process); 
}

StartVidoe();
