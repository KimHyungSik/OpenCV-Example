import cv2
import numpy as np

capture = cv2.VideoCapture(1, cv2.CAP_DSHOW)
capture.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

#배경제거 알고리즘
fgbg = cv2.createBackgroundSubtractorKNN()

#형태 변환 알고리즘(배경 제거에서 노이즈 제거용)
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(3,3))

#피부색(YCbCr)
lower = np.array([0,133,77])
upper = np.array([255,173,127])

while True:
    ret, frame = capture.read()

    frame = cv2.GaussianBlur(frame, (11, 11), cv2.BORDER_DEFAULT)

    #배경제거
    frame_bg = fgbg.apply(frame)
    frame_bg = cv2.morphologyEx(frame_bg, cv2.MORPH_OPEN, kernel)

    frame = cv2.bitwise_and(frame, frame, mask=frame_bg)

    #색변환
    frame_YCbCr = cv2.cvtColor(frame, cv2.COLOR_BGR2YCR_CB)
    frame_YCbCr = cv2.inRange(frame_YCbCr, lower, upper)

    contours, hierarchy = cv2.findContours(frame_YCbCr, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if w * h > 25000:
            cv2.rectangle(frame, (x,y), (x+w, y+h), (0,0,255), 3)

    frame = cv2.flip(frame, 1)
    cv2.imshow("VideoFrame", frame)
    if cv2.waitKey(1) > 0: break

capture.release()
cv2.destroyAllWindows()