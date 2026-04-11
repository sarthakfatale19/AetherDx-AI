"""
Synthetic training dataset for AetherDx AI Health Prediction System.
Generates ~2000 samples with 15 symptom features for 4 conditions:
Diabetes, Hypertension, Anemia, Healthy
"""

import numpy as np
import pandas as pd
from typing import Tuple

# Symptom feature columns
SYMPTOM_FEATURES = [
    "fatigue", "excessive_thirst", "frequent_urination", "blurred_vision",
    "headache", "dizziness", "shortness_of_breath", "pale_skin",
    "cold_hands", "chest_pain", "numbness_tingling", "slow_healing",
    "dark_urine", "swelling", "weight_change"
]

# Severity mapping
SEVERITY_MAP = {"mild": 0.3, "moderate": 0.6, "severe": 1.0}

# Duration mapping
DURATION_MAP = {"days": 0.5, "weeks": 0.8, "months": 1.0}

# Disease label mapping
DISEASE_LABELS = {0: "Healthy", 1: "Diabetes", 2: "Hypertension", 3: "Anemia"}
DISEASE_NAMES = list(DISEASE_LABELS.values())

# Symptom-to-index mapping
SYMPTOM_INDEX = {name: i for i, name in enumerate(SYMPTOM_FEATURES)}

# Symptom aliases for NLP matching (English)
SYMPTOM_ALIASES = {
    "tired": "fatigue", "exhausted": "fatigue", "weak": "fatigue", "low energy": "fatigue",
    "thirsty": "excessive_thirst", "drinking a lot": "excessive_thirst", "dry mouth": "excessive_thirst",
    "urinating often": "frequent_urination", "peeing a lot": "frequent_urination",
    "blurry vision": "blurred_vision", "vision problems": "blurred_vision", "can't see clearly": "blurred_vision",
    "head pain": "headache", "migraine": "headache",
    "dizzy": "dizziness", "lightheaded": "dizziness", "vertigo": "dizziness", "faint": "dizziness",
    "breathless": "shortness_of_breath", "difficulty breathing": "shortness_of_breath", "can't breathe": "shortness_of_breath",
    "pale": "pale_skin", "pallor": "pale_skin", "looking pale": "pale_skin",
    "cold extremities": "cold_hands", "cold fingers": "cold_hands", "cold feet": "cold_hands",
    "chest pressure": "chest_pain", "heart pain": "chest_pain", "tightness in chest": "chest_pain",
    "tingling": "numbness_tingling", "numb": "numbness_tingling", "pins and needles": "numbness_tingling",
    "wounds not healing": "slow_healing", "cuts not healing": "slow_healing",
    "dark pee": "dark_urine", "brown urine": "dark_urine",
    "swollen": "swelling", "puffiness": "swelling", "edema": "swelling", "bloating": "swelling",
    "weight loss": "weight_change", "weight gain": "weight_change", "losing weight": "weight_change",
    "gaining weight": "weight_change",
    # --- Hindi (Devanagari) aliases ---
    "थकान": "fatigue", "कमज़ोरी": "fatigue", "कमजोरी": "fatigue", "थका हुआ": "fatigue",
    "प्यास": "excessive_thirst", "बहुत प्यास": "excessive_thirst", "मुंह सूखना": "excessive_thirst",
    "बार बार पेशाब": "frequent_urination", "ज्यादा पेशाब": "frequent_urination",
    "धुंधला दिखना": "blurred_vision", "नज़र कमज़ोर": "blurred_vision", "आंखों में धुंधलापन": "blurred_vision",
    "सिरदर्द": "headache", "सिर दर्द": "headache", "सिर में दर्द": "headache", "माइग्रेन": "headache",
    "चक्कर": "dizziness", "चक्कर आना": "dizziness", "सिर घूमना": "dizziness",
    "सांस फूलना": "shortness_of_breath", "सांस लेने में तकलीफ": "shortness_of_breath", "दम फूलना": "shortness_of_breath",
    "पीला": "pale_skin", "चेहरा पीला": "pale_skin",
    "हाथ ठंडे": "cold_hands", "पैर ठंडे": "cold_hands", "ठंडे हाथ पैर": "cold_hands",
    "सीने में दर्द": "chest_pain", "छाती में दर्द": "chest_pain", "दिल में दर्द": "chest_pain",
    "सुन्न": "numbness_tingling", "झनझनाहट": "numbness_tingling", "सुन्नपन": "numbness_tingling",
    "घाव ठीक नहीं": "slow_healing", "जख्म नहीं भरना": "slow_healing",
    "गहरा पेशाब": "dark_urine", "पीला पेशाब": "dark_urine",
    "सूजन": "swelling", "पेट फूलना": "swelling", "सूजा हुआ": "swelling",
    "वजन कम": "weight_change", "वजन बढ़ना": "weight_change", "मोटापा": "weight_change",
    # --- Hinglish (transliterated) aliases ---
    "thakan": "fatigue", "kamzori": "fatigue", "thaka hua": "fatigue",
    "pyaas": "excessive_thirst", "bahut pyaas": "excessive_thirst",
    "baar baar peshab": "frequent_urination", "zyada peshab": "frequent_urination",
    "dhundhla dikhna": "blurred_vision", "nazar kamzor": "blurred_vision",
    "sir dard": "headache", "sar dard": "headache", "sir me dard": "headache",
    "chakkar": "dizziness", "chakkar aana": "dizziness", "sir ghoomna": "dizziness",
    "saans phoolna": "shortness_of_breath", "saans lene me takleef": "shortness_of_breath", "dam phoolna": "shortness_of_breath",
    "seene me dard": "chest_pain", "chhati me dard": "chest_pain", "dil me dard": "chest_pain",
    "sunn": "numbness_tingling", "jhunjhuni": "numbness_tingling",
    "sujan": "swelling", "pet phoolna": "swelling",
    "bukhar": "fatigue", "bukhaar": "fatigue",
}


def generate_synthetic_dataset(n_samples: int = 2000, random_state: int = 42) -> Tuple[pd.DataFrame, pd.Series]:
    """Generate a synthetic health dataset with realistic symptom patterns."""
    np.random.seed(random_state)

    samples_per_class = n_samples // 4
    X_all = []
    y_all = []

    # --- Healthy (label 0) ---
    for _ in range(samples_per_class):
        features = np.random.uniform(0.0, 0.15, len(SYMPTOM_FEATURES))
        # Occasionally a mild symptom
        if np.random.random() < 0.3:
            idx = np.random.randint(0, len(SYMPTOM_FEATURES))
            features[idx] = np.random.uniform(0.1, 0.3)
        X_all.append(features)
        y_all.append(0)

    # --- Diabetes (label 1) ---
    # Key symptoms: excessive_thirst, frequent_urination, fatigue, blurred_vision, 
    # numbness_tingling, slow_healing, weight_change
    diabetes_key = [1, 2, 0, 3, 10, 11, 14]  # indices
    for _ in range(samples_per_class):
        features = np.random.uniform(0.0, 0.2, len(SYMPTOM_FEATURES))
        # Strong signals for key diabetes symptoms
        for idx in diabetes_key:
            severity = np.random.choice([0.3, 0.6, 1.0], p=[0.2, 0.4, 0.4])
            duration = np.random.choice([0.5, 0.8, 1.0], p=[0.2, 0.3, 0.5])
            features[idx] = severity * duration * np.random.uniform(0.7, 1.0)
        # Add some noise to non-key symptoms
        noise_count = np.random.randint(1, 4)
        noise_indices = np.random.choice(
            [i for i in range(len(SYMPTOM_FEATURES)) if i not in diabetes_key],
            size=min(noise_count, len(SYMPTOM_FEATURES) - len(diabetes_key)),
            replace=False
        )
        for idx in noise_indices:
            features[idx] = np.random.uniform(0.1, 0.35)
        X_all.append(features)
        y_all.append(1)

    # --- Hypertension (label 2) ---
    # Key symptoms: headache, dizziness, chest_pain, shortness_of_breath, 
    # blurred_vision, swelling, numbness_tingling
    hypertension_key = [4, 5, 9, 6, 3, 13, 10]
    for _ in range(samples_per_class):
        features = np.random.uniform(0.0, 0.2, len(SYMPTOM_FEATURES))
        for idx in hypertension_key:
            severity = np.random.choice([0.3, 0.6, 1.0], p=[0.15, 0.4, 0.45])
            duration = np.random.choice([0.5, 0.8, 1.0], p=[0.15, 0.35, 0.5])
            features[idx] = severity * duration * np.random.uniform(0.7, 1.0)
        noise_count = np.random.randint(1, 4)
        noise_indices = np.random.choice(
            [i for i in range(len(SYMPTOM_FEATURES)) if i not in hypertension_key],
            size=min(noise_count, len(SYMPTOM_FEATURES) - len(hypertension_key)),
            replace=False
        )
        for idx in noise_indices:
            features[idx] = np.random.uniform(0.1, 0.35)
        X_all.append(features)
        y_all.append(2)

    # --- Anemia (label 3) ---
    # Key symptoms: fatigue, pale_skin, dizziness, cold_hands, shortness_of_breath,
    # dark_urine, headache
    anemia_key = [0, 7, 5, 8, 6, 12, 4]
    for _ in range(samples_per_class):
        features = np.random.uniform(0.0, 0.2, len(SYMPTOM_FEATURES))
        for idx in anemia_key:
            severity = np.random.choice([0.3, 0.6, 1.0], p=[0.2, 0.35, 0.45])
            duration = np.random.choice([0.5, 0.8, 1.0], p=[0.2, 0.3, 0.5])
            features[idx] = severity * duration * np.random.uniform(0.7, 1.0)
        noise_count = np.random.randint(1, 4)
        noise_indices = np.random.choice(
            [i for i in range(len(SYMPTOM_FEATURES)) if i not in anemia_key],
            size=min(noise_count, len(SYMPTOM_FEATURES) - len(anemia_key)),
            replace=False
        )
        for idx in noise_indices:
            features[idx] = np.random.uniform(0.1, 0.35)
        X_all.append(features)
        y_all.append(3)

    X = pd.DataFrame(np.array(X_all), columns=SYMPTOM_FEATURES)
    y = pd.Series(y_all, name="condition")

    # Shuffle
    shuffle_idx = np.random.permutation(len(X))
    X = X.iloc[shuffle_idx].reset_index(drop=True)
    y = y.iloc[shuffle_idx].reset_index(drop=True)

    return X, y
