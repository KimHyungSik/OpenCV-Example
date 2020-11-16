let width=480, height=640;
const video = document.getElementById("video");
const canvas = document.getElementById('output');
const testText = document.getElementById('testText');
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
let src, dist, hsv, cap, dst, hsvs, M, anchor, ksize, distTrans, fingerMat;
//inRange
let low, high, lower, upper;
//Contour
let contours, hierarchy, hull;
//Color
let Red, Blue, Green;
//Hull
let defect, hullDefect;
//finger
let findContours;

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
    M = cv.Mat.ones(5, 5, cv.CV_8UC1);
    anchor = new cv.Point(-1, -1);

    //캠
    cap = new cv.VideoCapture('video');

    //GaussianBulr 설정
    ksize = new cv.Size(5, 5);

    fingerMat = new cv.Mat();

    setTimeout(process, 33);
}

let centerX,centerY, moveCountX = 0, moveCountY = 0;

const  responsiveness = 9;

function process() {
    let MaxW = 0, MaxH = 0, MaxX = 0, MaxY = 0, countPoint = 0;
    cap.read(src);
    // 손 찾기 쉽게 변경
    cv.GaussianBlur(src, src, ksize, 0, 0, cv.BORDER_DEFAULT);

    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsvs, cv.COLOR_RGB2HSV);

    low = new cv.Mat(height, width, hsvs.type(), lower);
    high = new cv.Mat(height, width, hsvs.type(), upper);
    contours = new cv.MatVector();
    findContours = new cv.MatVector();
    hierarchy = new cv.Mat();
    hull = new cv.MatVector();
    distTrans = new cv.Mat();

    //색 추출
    cv.inRange(hsvs, low, high, dist);

    //증식, 침식
    cv.dilate(dist, dst, M, anchor, 3, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    cv.erode(dst, dst, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

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
            if(MaxY < rect.y){
                MaxW = rect.width;
                MaxH = rect.height;
                MaxX = rect.x;
                MaxY = rect.y;
                HandNum = i;
                
            }
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
    cv.circle(src, new cv.Point(minMaxResult.maxLoc.x + MaxX, minMaxResult.maxLoc.y + MaxY), minMaxResult.maxVal * (MaxW + MaxH)/6, Green, 2);

    //상하 확인
    if(centerY < MaxY + (MaxH/2)){
        if(moveCountY > 0){moveCountY = 0}
        moveCountY--;
    }

    if(centerY > MaxY + (MaxH/2)){
        if(moveCountY < 0){moveCountY = 0}
        moveCountY++;
    }

    //좌우 확인
    if(centerX < MaxX + (MaxW/2)){
        if(moveCountX > 0){moveCountX = 0}
        moveCountX--;
    }
    if(centerX > MaxX + (MaxW/2)){
        if(moveCountX < 0){moveCountX = 0}
        moveCountX++;

    }

    //상하 좌우 중 이동량이 많은 쪽으로 결정
    if(Math.abs(moveCountX) > Math.abs(moveCountY)){
        if(moveCountX > responsiveness){
            testText.innerHTML = "Right";
            moveCountX = 0;
            moveCountY = 0;
        }
        if(moveCountX < -responsiveness){
            testText.innerHTML = "Left";
            moveCountX = 0;
            moveCountY = 0;
        }
    }else{
        if(moveCountY > responsiveness){
            testText.innerHTML = "UP";
            moveCountX = 0;
            moveCountY = 0;
        }
        if(moveCountY < -responsiveness){
            testText.innerHTML = "Down";
            moveCountX = 0;
            moveCountY = 0;
        }
    }

    //손 중앙점 업데이트
    centerX = MaxX + (MaxW/2);
    centerY = MaxY + (MaxH/2);

    //Hull 경계선 탐색
/*     let Conhull = new cv.Mat();
    let defect = new cv.Mat();
    try{
            
        let Hullcnt = contours.get(HandNum);
        
        cv.convexHull(Hullcnt, Conhull, false, false);
        cv.convexityDefects(Hullcnt, Conhull, defect);
        for (let j = 0; j < defect.rows; ++j) {
            let far = new cv.Point(Hullcnt.data32S[defect.data32S[j * 4 + 2] * 2],
                Hullcnt.data32S[defect.data32S[j * 4 + 2] * 2 + 1]);
            let handCenter = new cv.Point(MaxX + (MaxW/2), MaxY + (MaxH/2));
            if(Math.sqrt((handCenter.x - far.x)**2 + (handCenter.y - far.y)**2) > ((MaxW/2) + (MaxH/2))/2){
                cv.circle(src, far, 3, Red, -1);
                countPoint++;
            }
        }
 */
    try{
    cv.drawContours(src, hull, HandNum, Red, 1, 8, hierarchy, 0);
    }catch(e){

    }
    /*     
}catch(e){
    } */

    //손 트레킹
    cv.rectangle(src, new cv.Point(MaxX, MaxY), new cv.Point(MaxX + MaxW, MaxY +MaxH), Red, 2, cv.LINE_AA, 0);

    //좌우 변경
    cv.flip(src,src,1);

    //'output' 캔버스에 이미지 로딩
    cv.imshow('output', src);

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
    //Windows에 이미지 리로딩 부탁
    requestAnimationFrame(process); 
}

StartVidoe();
