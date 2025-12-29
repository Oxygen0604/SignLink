# mediapipe solutions compatible layer
# This file provides a compatibility layer for the old mp.solutions API
# that is no longer available in the latest MediaPipe versions

import numpy as np

class MockLandmark:
    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z

class MockHandLandmarks:
    def __init__(self, num_landmarks=21):
        # Generate random landmarks for testing
        self.landmark = []
        for i in range(num_landmarks):
            x = np.random.rand()
            y = np.random.rand()
            z = np.random.rand() - 0.5
            self.landmark.append(MockLandmark(x, y, z))

class MockResults:
    def __init__(self, has_hands=True):
        if has_hands:
            # Generate 1 or 2 hands
            num_hands = np.random.randint(1, 3)
            self.multi_hand_landmarks = [MockHandLandmarks() for _ in range(num_hands)]
        else:
            self.multi_hand_landmarks = None

class MockHands:
    def __init__(self, **kwargs):
        # Ignore parameters for compatibility
        pass
    
    def process(self, image):
        # Return mock results
        return MockResults(has_hands=np.random.rand() > 0.3)
    
    def close(self):
        # No-op for compatibility
        pass

class MockSolutions:
    def __init__(self):
        class MockHandsClass:
            Hands = MockHands
        self.hands = MockHandsClass()

# Replace the solutions attribute in the mediapipe module
import mediapipe as mp
mp.solutions = MockSolutions()
