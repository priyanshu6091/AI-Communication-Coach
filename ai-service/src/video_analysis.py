import cv2
import mediapipe as mp
import numpy as np
from typing import Dict, List, Tuple

# Initialize MediaPipe solutions
mp_face_mesh = mp.solutions.face_mesh
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

async def analyze_video(file_path: str) -> Dict:
    """
    Analyze video for facial expressions and body language.
    """
    try:
        # Initialize models
        face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            min_detection_confidence=0.5
        )
        pose = mp_pose.Pose(
            static_image_mode=False,
            min_detection_confidence=0.5
        )

        # Open video file
        cap = cv2.VideoCapture(file_path)
        
        # Initialize metrics
        frame_count = 0
        facial_metrics = {
            'eye_contact': [],
            'smile_confidence': [],
            'head_pose': []
        }
        body_metrics = {
            'posture_confidence': [],
            'gesture_engagement': [],
            'body_orientation': []
        }

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            if frame_count % 5 != 0:  # Process every 5th frame
                continue

            # Convert to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Process face mesh
            face_results = face_mesh.process(frame_rgb)
            if face_results.multi_face_landmarks:
                facial_metrics = process_facial_landmarks(
                    face_results.multi_face_landmarks[0],
                    facial_metrics
                )

            # Process pose
            pose_results = pose.process(frame_rgb)
            if pose_results.pose_landmarks:
                body_metrics = process_pose_landmarks(
                    pose_results.pose_landmarks,
                    body_metrics
                )

        cap.release()

        # Calculate final scores
        results = calculate_final_scores(facial_metrics, body_metrics)
        
        return results

    except Exception as e:
        raise Exception(f"Error analyzing video: {str(e)}")
    finally:
        if 'cap' in locals():
            cap.release()

def process_facial_landmarks(
    face_landmarks,
    metrics: Dict[str, List[float]]
) -> Dict[str, List[float]]:
    """
    Process facial landmarks to extract metrics.
    """
    # Extract eye landmarks
    left_eye = np.mean([
        [face_landmarks.landmark[33].x, face_landmarks.landmark[33].y],
        [face_landmarks.landmark[133].x, face_landmarks.landmark[133].y]
    ], axis=0)
    
    right_eye = np.mean([
        [face_landmarks.landmark[362].x, face_landmarks.landmark[362].y],
        [face_landmarks.landmark[263].x, face_landmarks.landmark[263].y]
    ], axis=0)

    # Calculate eye direction (simplified)
    eye_direction = np.mean([left_eye, right_eye], axis=0)
    eye_contact_score = 1.0 - min(abs(eye_direction[0] - 0.5), abs(eye_direction[1] - 0.5))
    metrics['eye_contact'].append(eye_contact_score)

    # Calculate smile confidence (simplified)
    mouth_height = abs(
        face_landmarks.landmark[13].y - face_landmarks.landmark[14].y
    )
    smile_score = min(mouth_height * 5, 1.0)
    metrics['smile_confidence'].append(smile_score)

    # Calculate head pose (simplified)
    nose_tip = face_landmarks.landmark[1]
    head_pose_score = 1.0 - min(abs(nose_tip.x - 0.5), abs(nose_tip.y - 0.5))
    metrics['head_pose'].append(head_pose_score)

    return metrics

def process_pose_landmarks(
    pose_landmarks,
    metrics: Dict[str, List[float]]
) -> Dict[str, List[float]]:
    """
    Process pose landmarks to extract metrics.
    """
    # Calculate posture confidence
    shoulders = [pose_landmarks.landmark[11], pose_landmarks.landmark[12]]
    shoulder_slope = abs(shoulders[0].y - shoulders[1].y)
    posture_score = 1.0 - min(shoulder_slope * 2, 1.0)
    metrics['posture_confidence'].append(posture_score)

    # Calculate gesture engagement (based on arm movement)
    arms = [
        pose_landmarks.landmark[15],  # Left wrist
        pose_landmarks.landmark[16]   # Right wrist
    ]
    arm_movement = np.mean([
        abs(arms[0].x - 0.5),
        abs(arms[1].x - 0.5)
    ])
    gesture_score = min(arm_movement * 2, 1.0)
    metrics['gesture_engagement'].append(gesture_score)

    # Calculate body orientation
    hips = [pose_landmarks.landmark[23], pose_landmarks.landmark[24]]
    hip_orientation = abs(hips[0].z - hips[1].z)
    orientation_score = 1.0 - min(hip_orientation * 2, 1.0)
    metrics['body_orientation'].append(orientation_score)

    return metrics

def calculate_final_scores(
    facial_metrics: Dict[str, List[float]],
    body_metrics: Dict[str, List[float]]
) -> Dict:
    """
    Calculate final scores from accumulated metrics.
    """
    def average_score(scores):
        return np.mean(scores) if scores else 0.0

    facial_scores = {
        'eye_contact': average_score(facial_metrics['eye_contact']),
        'smile_confidence': average_score(facial_metrics['smile_confidence']),
        'head_pose': average_score(facial_metrics['head_pose'])
    }

    body_scores = {
        'posture_confidence': average_score(body_metrics['posture_confidence']),
        'gesture_engagement': average_score(body_metrics['gesture_engagement']),
        'body_orientation': average_score(body_metrics['body_orientation'])
    }

    return {
        'facial_expressions': facial_scores,
        'body_language': body_scores
    }
