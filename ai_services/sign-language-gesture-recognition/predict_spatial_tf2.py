"""
Extract features from frames using trained model for TensorFlow 2.x
"""
import tensorflow as tf
import numpy as np
import os
import pickle
import argparse
from pathlib import Path
from tqdm import tqdm

def load_and_preprocess_image(image_path, image_size=299):
    """Load and preprocess a single image"""
    img = tf.io.read_file(image_path)
    img = tf.image.decode_jpeg(img, channels=3)
    img = tf.image.resize(img, [image_size, image_size])
    img = img / 255.0
    return img

def extract_features(model, frames_folder, batch_size=32, use_softmax=True):
    """Extract features from frames using the trained model"""
    frames_folder = Path(frames_folder)
    
    # Get all gesture classes
    gesture_classes = sorted([d.name for d in frames_folder.iterdir() if d.is_dir()])
    
    print(f"Found {len(gesture_classes)} gesture classes: {gesture_classes}\n")
    
    predictions = []
    
    for gesture_class in gesture_classes:
        gesture_dir = frames_folder / gesture_class
        frame_files = sorted(list(gesture_dir.glob('*.jpeg')))
        
        print(f"Processing {len(frame_files)} frames from '{gesture_class}'...")
        
        for i in tqdm(range(0, len(frame_files), batch_size), ascii=True):
            batch_files = frame_files[i:i + batch_size]
            
            # Load and preprocess batch
            batch_images = []
            for frame_file in batch_files:
                img = load_and_preprocess_image(str(frame_file))
                batch_images.append(img)
            
            batch_images = tf.stack(batch_images)
            
            # Get predictions
            if use_softmax:
                # Get softmax probabilities
                preds = model.predict(batch_images, verbose=0)
            else:
                # Get features from second-to-last layer (before softmax)
                feature_extractor = tf.keras.Model(
                    inputs=model.input,
                    outputs=model.layers[-2].output  # Get dropout layer output
                )
                preds = feature_extractor.predict(batch_images, verbose=0)
            
            # Store predictions with labels
            for pred in preds:
                predictions.append([pred.tolist(), gesture_class])
    
    return predictions

def main():
    parser = argparse.ArgumentParser(description='Extract features from frames using trained model')
    parser.add_argument('model_file', help='Path to trained model (.h5 file)')
    parser.add_argument('frames_folder', help='Path to folder containing folders of frames')
    parser.add_argument('--test', action='store_true', help='Pass if frames_folder belongs to test data')
    parser.add_argument('--batch_size', type=int, default=32, help='Batch size')
    parser.add_argument('--use_features', action='store_true', 
                        help='Use features from last layer instead of softmax probabilities')
    
    args = parser.parse_args()
    
    # Load model
    print(f"Loading model from {args.model_file}...")
    model = tf.keras.models.load_model(args.model_file)
    print("Model loaded successfully!\n")
    
    # Extract features
    use_softmax = not args.use_features
    predictions = extract_features(
        model, 
        args.frames_folder, 
        batch_size=args.batch_size,
        use_softmax=use_softmax
    )
    
    # Determine output filename
    train_or_test = "test" if args.test else "train"
    feature_type = "features" if args.use_features else "final_result"
    output_file = f'predicted-frames-{feature_type}-{train_or_test}.pkl'
    
    # Save predictions
    print(f"\nSaving predictions to: {output_file}")
    with open(output_file, 'wb') as fout:
        pickle.dump(predictions, fout)
    
    print(f"Saved {len(predictions)} predictions")
    print("Done!")

if __name__ == '__main__':
    main()
