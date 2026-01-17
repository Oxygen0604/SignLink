
import os
import sys

# Add backend directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from app.core.config import config
import tensorflow as tf
from tensorflow import keras

print(f"Checking model path: {config.get_model_path()}")
print(f"Checking labels path: {config.get_labels_path()}")

model_path = config.get_model_path()
labels_path = config.get_labels_path()

if not os.path.exists(model_path):
    print(f"❌ Model file NOT found at: {model_path}")
else:
    print(f"✅ Model file found at: {model_path}")

if not os.path.exists(labels_path):
    print(f"❌ Labels file NOT found at: {labels_path}")
else:
    print(f"✅ Labels file found at: {labels_path}")

if os.path.exists(model_path):
    try:
        print("Attempting to load model...")
        model = keras.models.load_model(model_path)
        print("✅ Model loaded successfully!")
        print(f"Input shape: {model.input_shape}")
    except Exception as e:
        print(f"❌ Failed to load model: {str(e)}")

