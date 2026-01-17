
import os
import sys
import numpy as np
import cv2

# Ensure we can import from backend app
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from app.core.config import config
from app.core.recognizer import SignLanguageRecognizer

def test_inference():
    print("="*50)
    print("🧪 Starting Model Inference Test")
    print("="*50)

    # 1. Check Paths
    model_path = config.get_model_path()
    labels_path = config.get_labels_path()
    print(f"📍 Model Path: {model_path}")
    print(f"📍 Labels Path: {labels_path}")

    if not os.path.exists(model_path):
        print("❌ Error: Model file not found!")
        return
    if not os.path.exists(labels_path):
        print("❌ Error: Labels file not found!")
        return

    # 2. Initialize Recognizer
    print("\n🔄 Initializing Recognizer...")
    try:
        recognizer = SignLanguageRecognizer(model_path, labels_path)
        if not recognizer.is_ready():
            print("❌ Error: Recognizer reported not ready after init.")
            return
        print("✅ Recognizer initialized successfully.")
        print(f"   - Classes: {recognizer.labels}")
    except Exception as e:
        print(f"❌ Exception during initialization: {e}")
        return

    # 3. Create Dummy Image (Black image)
    # MediaPipe expects BGR, 640x480 is a standard size
    print("\n🖼️ Creating dummy image (640x480, black)...")
    dummy_image = np.zeros((480, 640, 3), dtype=np.uint8)

    # 4. Run Prediction
    print("🚀 Running prediction on dummy image...")
    try:
        label, confidence, landmarks = recognizer.predict(dummy_image)
        
        # Since it's a black image, we expect NO hand detection
        if label is None:
            print("✅ Prediction successful (Correctly detected NO hand).")
        else:
            print(f"⚠️ Warning: Detected hand in black image? Label: {label}, Conf: {confidence}")
            
    except Exception as e:
        print(f"❌ Exception during prediction: {e}")
        return

    print("\n" + "="*50)
    print("🎉 Test Completed Successfully!")
    print("="*50)

if __name__ == "__main__":
    test_inference()
