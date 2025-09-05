from fastapi import FastAPI, File, UploadFile
import cv2
import mediapipe as mp

app = FastAPI()
mp_hands = mp.solutions.hands.Hands()
mp_draw = mp.solutions.drawing_utils

@app.post("/recognize/realtime")
async def recognize_realtime(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    results = mp_hands.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

    if results.multi_hand_landmarks:
        landmarks = results.multi_hand_landmarks[0]
        # 将 landmarks 转换为 feature 向量
        features = extract_feature_vector(landmarks)
        word = gesture_to_word(features)
        return {"text": word}
    else:
        return {"text": ""}

@app.post("/recognize/upload")
async def recognize_upload(file: UploadFile = File(...)):
    # 支持图片或视频类型判断
    ext = file.filename.split(".")[-1]
    if ext in ["jpg", "png"]:
        return await recognize_realtime(file)
    elif ext in ["mp4", "avi"]:
        return recognize_from_video(file)