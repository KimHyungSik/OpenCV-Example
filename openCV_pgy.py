import numpy as np
import cv2 as cv
cap = cv.VideoCapture(0, cv.CAP_DSHOW)
if not cap.isOpened():
    print("Cannot open camera")
    exit()
while True:
    # Capture frame-by-frame
    ret, img = cap.read()

    # if frame is read correctly ret is True
    if not ret:
        print("Can't receive frame (stream end?). Exiting ...")
        break

    img = cv.GaussianBlur(img,(5,5),0)

    # Our operations on the frame come here
    hsv = cv.cvtColor(img, cv.COLOR_BGR2HSV)

    lower = np.array([0, 5, 5])
    upper = np.array([40, 240, 240])

    # Threshold the HSV image to get only blue colors
    mask = cv.inRange(hsv, lower, upper)

    # Bitwise-AND mask and original image
    masked = cv.bitwise_and(img, img, mask=mask)

    edges = cv.Canny(img, 100, 200)
    edges_bgr = cv.cvtColor(edges, cv.COLOR_GRAY2BGR)
    frame = cv.bitwise_or(edges_bgr, masked, mask=mask)
    frame = cv.flip(frame, 1)
    # Display the resulting frame
    cv.imshow('frame', frame)
    if cv.waitKey(1) == ord('q'):
        break
# When everything done, release the capture
cap.release()
cv.destroyAllWindows()