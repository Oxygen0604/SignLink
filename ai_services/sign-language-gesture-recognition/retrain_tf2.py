"""
Retrain Inception V3 model for gesture recognition using TensorFlow 2.x
"""
import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
import os
from pathlib import Path
import argparse

def create_model(num_classes, image_size=299):
    """Create transfer learning model using Inception V3"""
    # Use MobileNetV2 instead for better compatibility
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(image_size, image_size, 3),
        include_top=False,
        weights='imagenet',
        pooling='avg'
    )
    base_model.trainable = False
    
    inputs = tf.keras.Input(shape=(image_size, image_size, 3))
    x = base_model(inputs, training=False)
    x = tf.keras.layers.Dropout(0.4)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation='softmax')(x)
    
    model = tf.keras.Model(inputs, outputs)
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def load_and_preprocess_image(image_path, image_size=299):
    """Load and preprocess a single image"""
    img = tf.io.read_file(image_path)
    img = tf.image.decode_jpeg(img, channels=3)
    img = tf.image.resize(img, [image_size, image_size])
    img = img / 255.0
    return img

def create_dataset(image_dir, batch_size=32, validation_split=0.2):
    """Create training and validation datasets"""
    image_dir = Path(image_dir)
    
    # Get all image paths and labels
    image_paths = []
    labels = []
    class_names = sorted([d.name for d in image_dir.iterdir() if d.is_dir()])
    
    print(f"Found {len(class_names)} classes: {class_names}")
    
    for class_idx, class_name in enumerate(class_names):
        class_dir = image_dir / class_name
        for img_path in class_dir.glob('*.jpeg'):
            image_paths.append(str(img_path))
            labels.append(class_idx)
    
    # Convert to numpy arrays
    image_paths = np.array(image_paths)
    labels = np.array(labels)
    
    # Shuffle
    indices = np.random.permutation(len(image_paths))
    image_paths = image_paths[indices]
    labels = labels[indices]
    
    # Split into train and validation
    split_idx = int(len(image_paths) * (1 - validation_split))
    train_paths = image_paths[:split_idx]
    train_labels = labels[:split_idx]
    val_paths = image_paths[split_idx:]
    val_labels = labels[split_idx:]
    
    print(f"Training samples: {len(train_paths)}")
    print(f"Validation samples: {len(val_paths)}")
    
    # Create datasets
    def create_tf_dataset(paths, labels, is_training=True):
        # Create dataset from paths and labels
        dataset = tf.data.Dataset.from_tensor_slices((paths, labels))
        
        # Load and preprocess images
        def load_image(path, label):
            img = load_and_preprocess_image(path)
            # Convert label to one-hot
            label_one_hot = tf.one_hot(label, len(class_names))
            return img, label_one_hot
        
        dataset = dataset.map(load_image, num_parallel_calls=tf.data.AUTOTUNE)
        
        if is_training:
            dataset = dataset.shuffle(1000)
        
        dataset = dataset.batch(batch_size)
        dataset = dataset.prefetch(tf.data.AUTOTUNE)
        
        return dataset
    
    train_dataset = create_tf_dataset(train_paths, train_labels, is_training=True)
    val_dataset = create_tf_dataset(val_paths, val_labels, is_training=False)
    
    return train_dataset, val_dataset, class_names

def main():
    parser = argparse.ArgumentParser(description='Retrain Inception V3 for gesture recognition')
    parser.add_argument('--image_dir', type=str, default='train_frames',
                        help='Directory containing training images organized by class')
    parser.add_argument('--output_model', type=str, default='gesture_model',
                        help='Output model name (without extension)')
    parser.add_argument('--batch_size', type=int, default=32,
                        help='Batch size for training')
    parser.add_argument('--epochs', type=int, default=10,
                        help='Number of epochs to train')
    
    args = parser.parse_args()
    
    print("Creating datasets...")
    train_dataset, val_dataset, class_names = create_dataset(
        args.image_dir, 
        batch_size=args.batch_size
    )
    
    # Save class names
    with open('retrained_labels.txt', 'w') as f:
        for name in class_names:
            f.write(f"{name}\n")
    print(f"Saved class labels to retrained_labels.txt")
    
    print("\nCreating model...")
    model = create_model(len(class_names))
    model.summary()
    
    print("\nTraining model...")
    # Callbacks
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            f'{args.output_model}_best.h5',
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=3,
            restore_best_weights=True
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=2,
            verbose=1
        )
    ]
    
    history = model.fit(
        train_dataset,
        validation_data=val_dataset,
        epochs=args.epochs,
        callbacks=callbacks
    )
    
    # Save final model
    model.save(f'{args.output_model}.h5')
    print(f"\nModel saved to {args.output_model}.h5")
    
    # Also save in SavedModel format for compatibility
    model.save(f'{args.output_model}_savedmodel')
    print(f"Model also saved to {args.output_model}_savedmodel/")

if __name__ == '__main__':
    main()
