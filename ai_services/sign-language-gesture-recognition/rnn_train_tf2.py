"""
Train RNN model using TensorFlow 2.x Keras
"""
import tensorflow as tf
import numpy as np
import pickle
import argparse
from sklearn.model_selection import train_test_split
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

def get_data(input_data_dump, num_frames_per_video, labels, split=True):
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
            actual = labels[actual]
            
            # Collect frames for one video
            if len(temp_list) == num_frames_per_video - 1:
                temp_list.append(features)
                X.append(np.array(temp_list))
                y.append(actual)
                temp_list = []
            else:
                temp_list.append(features)
    
    print("\nClass Name\tNumeric Label")
    for key in labels:
        print(f"{key}\t\t{labels[key]}")
    
    # Convert to numpy arrays
    X = np.array(X)
    y = np.array(y)
    
    print(f"\nDataset shape: {X.shape}")
    print(f"Labels shape: {y.shape}")
    
    # One-hot encode labels
    y = tf.keras.utils.to_categorical(y, len(labels))
    
    if split:
        # Split into train and validation
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        return X_train, X_val, y_train, y_val
    else:
        return X, y

def create_rnn_model(num_frames, input_size, num_classes, model_type='wide'):
    """Create RNN model"""
    model = tf.keras.Sequential()
    
    if model_type == 'wide':
        # Wider LSTM (single layer, more units)
        model.add(tf.keras.layers.Input(shape=(num_frames, input_size)))
        model.add(tf.keras.layers.LSTM(256, dropout=0.2))
        model.add(tf.keras.layers.Dense(num_classes, activation='softmax'))
    
    elif model_type == 'deep':
        # Deeper LSTM (multiple layers)
        model.add(tf.keras.layers.Input(shape=(num_frames, input_size)))
        model.add(tf.keras.layers.LSTM(64, dropout=0.2, return_sequences=True))
        model.add(tf.keras.layers.LSTM(64, dropout=0.2, return_sequences=True))
        model.add(tf.keras.layers.LSTM(64, dropout=0.2))
        model.add(tf.keras.layers.Dense(num_classes, activation='softmax'))
    
    else:  # default
        # Standard LSTM
        model.add(tf.keras.layers.Input(shape=(num_frames, input_size)))
        model.add(tf.keras.layers.LSTM(128, dropout=0.8, return_sequences=True))
        model.add(tf.keras.layers.LSTM(128, dropout=0.8))
        model.add(tf.keras.layers.Dense(num_classes, activation='softmax'))
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def main():
    parser = argparse.ArgumentParser(description='Train RNN for gesture recognition')
    parser.add_argument('input_file_dump', 
                        help='File containing intermediate representation from CNN')
    parser.add_argument('model_file', 
                        help='Name of the model file to save (will be saved in checkpoints/)')
    parser.add_argument('--label_file', default='retrained_labels.txt',
                        help='Path to label file')
    parser.add_argument('--batch_size', type=int, default=32,
                        help='Batch size for training')
    parser.add_argument('--epochs', type=int, default=10,
                        help='Number of epochs to train')
    parser.add_argument('--model_type', choices=['default', 'wide', 'deep'], 
                        default='wide',
                        help='Type of RNN architecture')
    
    args = parser.parse_args()
    
    # Load labels
    labels = load_labels(args.label_file)
    num_classes = len(labels)
    num_frames_per_video = 201
    
    print(f"Loading data from {args.input_file_dump}...")
    X_train, X_val, y_train, y_val = get_data(
        args.input_file_dump, 
        num_frames_per_video, 
        labels, 
        split=True
    )
    
    # Get input size
    input_size = X_train.shape[2]
    print(f"Input size per frame: {input_size}")
    
    # Create model
    print(f"\nCreating {args.model_type} RNN model...")
    
    # Check if model exists
    model_path = Path('checkpoints') / args.model_file
    model_path_h5 = model_path.with_suffix('.h5')
    
    if model_path_h5.exists():
        print(f"Loading existing model from {model_path_h5}")
        model = tf.keras.models.load_model(str(model_path_h5))
        print("Model loaded successfully!")
    else:
        model = create_rnn_model(num_frames_per_video, input_size, num_classes, args.model_type)
        print("Created new model")
    
    model.summary()
    
    # Callbacks
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            str(model_path_h5),
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=3,
            restore_best_weights=True,
            verbose=1
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=2,
            verbose=1
        )
    ]
    
    print(f"\nTraining model for {args.epochs} epochs...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        batch_size=args.batch_size,
        epochs=args.epochs,
        callbacks=callbacks,
        verbose=1
    )
    
    print(f"\nModel saved to {model_path_h5}")
    
    # Final evaluation
    print("\nFinal evaluation:")
    train_loss, train_acc = model.evaluate(X_train, y_train, verbose=0)
    val_loss, val_acc = model.evaluate(X_val, y_val, verbose=0)
    
    print(f"Training accuracy: {train_acc:.4f}")
    print(f"Validation accuracy: {val_acc:.4f}")

if __name__ == '__main__':
    main()
