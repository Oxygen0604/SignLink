"""
Evaluate RNN model using TensorFlow 2.x Keras
"""
import tensorflow as tf
import numpy as np
import pickle
import argparse
from pathlib import Path

def load_labels(label_file):
    """Load labels from file"""
    labels = {}
    count = 0
    with open(label_file, 'r') as f:
        for line in f:
            labels[line.strip().lower()] = count
            count += 1
    return labels

def get_data(input_data_dump, num_frames_per_video, labels):
    """Load and prepare data from pickle file"""
    X = []
    y = []
    temp_list = []
    
    # Load features
    with open(input_data_dump, 'rb') as fin:
        frames = pickle.load(fin)
        
        for i, frame in enumerate(frames):
            features = frame[0]
            actual = frame[1].lower()
            
            # Convert label to numeric
            actual_numeric = labels[actual]
            
            # Collect frames for one video
            if len(temp_list) == num_frames_per_video - 1:
                temp_list.append(features)
                X.append(np.array(temp_list))
                y.append((actual_numeric, actual))  # Store both numeric and string label
                temp_list = []
            else:
                temp_list.append(features)
    
    print("\nClass Name\tNumeric Label")
    for key in labels:
        print(f"{key}\t\t{labels[key]}")
    
    # Convert to numpy arrays
    X = np.array(X)
    
    print(f"\nDataset shape: {X.shape}")
    print(f"Number of videos: {len(y)}")
    
    return X, y

def main():
    parser = argparse.ArgumentParser(description='Evaluate RNN for gesture recognition')
    parser.add_argument('input_file_dump', 
                        help='File containing intermediate representation from CNN')
    parser.add_argument('model_file', 
                        help='Name of the model file to use (in checkpoints/)')
    parser.add_argument('--label_file', default='retrained_labels.txt',
                        help='Path to label file')
    parser.add_argument('--batch_size', type=int, default=32,
                        help='Batch size for prediction')
    
    args = parser.parse_args()
    
    # Load labels
    labels = load_labels(args.label_file)
    num_classes = len(labels)
    num_frames_per_video = 201
    
    # Reverse labels for lookup
    label_names = {v: k for k, v in labels.items()}
    
    print(f"Loading data from {args.input_file_dump}...")
    X_test, y_test = get_data(
        args.input_file_dump, 
        num_frames_per_video, 
        labels
    )
    
    # Load model
    model_path = Path('checkpoints') / args.model_file
    model_path_h5 = model_path.with_suffix('.h5')
    
    print(f"\nLoading model from {model_path_h5}...")
    model = tf.keras.models.load_model(str(model_path_h5))
    print("Model loaded successfully!")
    
    # Make predictions
    print("\nMaking predictions...")
    predictions = model.predict(X_test, batch_size=args.batch_size, verbose=1)
    
    # Get predicted classes
    predicted_classes = np.argmax(predictions, axis=1)
    
    # Write results to file
    results_file = 'results.txt'
    print(f"\nWriting results to {results_file}...")
    
    correct = 0
    total = len(y_test)
    
    with open(results_file, 'w', encoding='utf-8') as f:
        f.write("Video ID\tPredicted\tActual\t\tCorrect?\tConfidence\n")
        f.write("="*70 + "\n")
        
        for i, (pred_class, (actual_numeric, actual_str)) in enumerate(zip(predicted_classes, y_test)):
            pred_label = label_names[pred_class]
            confidence = predictions[i][pred_class]
            is_correct = pred_class == actual_numeric
            
            if is_correct:
                correct += 1
            
            f.write(f"{i+1}\t\t{pred_label}\t\t{actual_str}\t\t"
                   f"{'OK' if is_correct else 'FAIL'}\t\t{confidence:.4f}\n")
        
        f.write("="*70 + "\n")
        f.write(f"\nAccuracy: {correct}/{total} = {(correct/total)*100:.2f}%\n")
        
        # Confusion information
        f.write(f"\nCorrect predictions: {correct}\n")
        f.write(f"Incorrect predictions: {total - correct}\n")
    
    print(f"\nResults saved to {results_file}")
    print(f"\nTest Accuracy: {correct}/{total} = {(correct/total)*100:.2f}%")
    
    # Print summary
    print("\n" + "="*50)
    print("EVALUATION SUMMARY")
    print("="*50)
    for i, (pred_class, (actual_numeric, actual_str)) in enumerate(zip(predicted_classes, y_test)):
        pred_label = label_names[pred_class]
        confidence = predictions[i][pred_class]
        is_correct = "✓" if pred_class == actual_numeric else "✗"
        print(f"Video {i+1}: {pred_label} (confidence: {confidence:.4f}) | Actual: {actual_str} | {is_correct}")
    print("="*50)

if __name__ == '__main__':
    main()
