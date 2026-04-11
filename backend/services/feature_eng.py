"""
Feature Engineering Service for AetherDx AI.
Converts user symptom text + severity/duration into numerical feature vectors.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from data.symptoms_data import (
    SYMPTOM_FEATURES, SYMPTOM_ALIASES, SYMPTOM_INDEX,
    SEVERITY_MAP, DURATION_MAP
)


def parse_symptoms_from_text(text: str) -> List[str]:
    """Extract symptom names from free-text input."""
    text_lower = text.lower().strip()
    found_symptoms = set()

    # Check direct symptom names
    for symptom in SYMPTOM_FEATURES:
        readable = symptom.replace("_", " ")
        if readable in text_lower or symptom in text_lower:
            found_symptoms.add(symptom)

    # Check aliases
    for alias, symptom in SYMPTOM_ALIASES.items():
        if alias in text_lower:
            found_symptoms.add(symptom)

    return list(found_symptoms)


def build_feature_vector(
    symptoms: List[str],
    severity: str = "moderate",
    duration: str = "weeks"
) -> np.ndarray:
    """
    Convert symptom list + severity/duration into a weighted feature vector.
    
    Feature value = severity_weight × duration_weight × base_intensity
    """
    features = np.zeros(len(SYMPTOM_FEATURES))

    severity_weight = SEVERITY_MAP.get(severity.lower(), 0.6)
    duration_weight = DURATION_MAP.get(duration.lower(), 0.8)

    for symptom in symptoms:
        # Resolve alias if needed
        resolved = SYMPTOM_ALIASES.get(symptom.lower(), symptom.lower())
        resolved = resolved.replace(" ", "_")

        if resolved in SYMPTOM_INDEX:
            idx = SYMPTOM_INDEX[resolved]
            # Base intensity with some variation
            base_intensity = np.random.uniform(0.75, 1.0)
            features[idx] = severity_weight * duration_weight * base_intensity

    return features


def build_feature_vector_from_structured(
    symptom_data: List[Dict]
) -> np.ndarray:
    """
    Convert structured symptom data into feature vector.
    
    Each item: {"symptom": "...", "severity": "mild|moderate|severe", "duration": "days|weeks|months"}
    """
    features = np.zeros(len(SYMPTOM_FEATURES))

    for item in symptom_data:
        symptom = item.get("symptom", "").lower().replace(" ", "_")
        severity = item.get("severity", "moderate")
        duration = item.get("duration", "weeks")

        # Resolve alias
        resolved = SYMPTOM_ALIASES.get(symptom.replace("_", " "), symptom)
        resolved = resolved.replace(" ", "_")

        if resolved in SYMPTOM_INDEX:
            idx = SYMPTOM_INDEX[resolved]
            sev_w = SEVERITY_MAP.get(severity.lower(), 0.6)
            dur_w = DURATION_MAP.get(duration.lower(), 0.8)
            features[idx] = sev_w * dur_w

    return features


def get_active_symptoms(feature_vector: np.ndarray, threshold: float = 0.1) -> List[Tuple[str, float]]:
    """Return symptoms with values above threshold, sorted by intensity."""
    active = []
    for i, val in enumerate(feature_vector):
        if val > threshold:
            active.append((SYMPTOM_FEATURES[i], float(val)))
    active.sort(key=lambda x: x[1], reverse=True)
    return active
