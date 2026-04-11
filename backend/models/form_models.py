"""
Pydantic Models for AetherDx AI Structured Health Assessment Form.
Includes input validation, derived features, and emergency thresholds.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, field_validator, model_validator
import math

class FlexibleBaseModel(BaseModel):
    @model_validator(mode='before')
    @classmethod
    def empty_strings_to_none(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return {k: (None if v == "" else v) for k, v in data.items()}
        return data


# ── Emergency Thresholds ──
EMERGENCY_THRESHOLDS = {
    "spo2_critical": 90,
    "temp_critical_f": 104.0,
    "temp_critical_c": 40.0,
    "hr_high": 150,
    "hr_low": 40,
    "bp_systolic_high": 180,
    "bp_diastolic_high": 120,
    "bp_systolic_low": 80,
}

COMPOUND_EMERGENCIES = [
    {"symptoms": ["chest_pain", "shortness_of_breath"], "reason": "Possible cardiac emergency"},
    {"symptoms": ["chest_pain", "numbness_tingling"], "reason": "Possible stroke or cardiac event"},
    {"symptoms": ["dizziness", "shortness_of_breath", "chest_pain"], "reason": "Critical cardiovascular distress"},
]


class VitalSigns(FlexibleBaseModel):
    temperature_f: Optional[float] = None
    heart_rate: Optional[int] = None
    spo2: Optional[float] = None
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None

    @field_validator("temperature_f")
    @classmethod
    def validate_temp(cls, v):
        if v is not None and (v < 90.0 or v > 115.0):
            raise ValueError("Temperature must be between 90°F and 115°F")
        return v

    @field_validator("heart_rate")
    @classmethod
    def validate_hr(cls, v):
        if v is not None and (v < 20 or v > 250):
            raise ValueError("Heart rate must be between 20 and 250 bpm")
        return v

    @field_validator("spo2")
    @classmethod
    def validate_spo2(cls, v):
        if v is not None and (v < 50 or v > 100):
            raise ValueError("SpO2 must be between 50% and 100%")
        return v

    @field_validator("bp_systolic", "bp_diastolic")
    @classmethod
    def validate_bp(cls, v):
        if v is not None and (v < 40 or v > 300):
            raise ValueError("Blood pressure must be between 40 and 300 mmHg")
        return v


class BodyMetrics(FlexibleBaseModel):
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    age: Optional[int] = None
    sex: Optional[str] = None  # "male", "female", "other"

    @field_validator("height_cm")
    @classmethod
    def validate_height(cls, v):
        if v is not None and (v < 50 or v > 275):
            raise ValueError("Height must be between 50cm and 275cm")
        return v

    @field_validator("weight_kg")
    @classmethod
    def validate_weight(cls, v):
        if v is not None and (v < 10 or v > 350):
            raise ValueError("Weight must be between 10kg and 350kg")
        return v

    @field_validator("age")
    @classmethod
    def validate_age(cls, v):
        if v is not None and (v < 1 or v > 130):
            raise ValueError("Age must be between 1 and 130")
        return v

    def get_bmi(self) -> Optional[float]:
        if self.height_cm and self.weight_kg and self.height_cm > 0:
            height_m = self.height_cm / 100
            return round(self.weight_kg / (height_m ** 2), 1)
        return None

    def get_bmi_category(self) -> Optional[str]:
        bmi = self.get_bmi()
        if bmi is None:
            return None
        if bmi < 18.5:
            return "Underweight"
        elif bmi < 25:
            return "Normal"
        elif bmi < 30:
            return "Overweight"
        else:
            return "Obese"


class SymptomEntry(FlexibleBaseModel):
    symptom: str
    severity: float = 5.0  # 0-10 scale
    duration: str = "weeks"  # days, weeks, months
    trend: str = "stable"  # improving, stable, worsening

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v):
        return max(0.0, min(10.0, v))

    @field_validator("duration")
    @classmethod
    def validate_duration(cls, v):
        if v not in ("days", "weeks", "months"):
            return "weeks"
        return v

    @field_validator("trend")
    @classmethod
    def validate_trend(cls, v):
        if v not in ("improving", "stable", "worsening"):
            return "stable"
        return v


class LifestyleBlock(FlexibleBaseModel):
    sleep_hours: Optional[float] = None
    stress_level: Optional[float] = None  # 0-10
    exercise_mins_week: Optional[float] = None
    diet_score: Optional[float] = None  # 0-10
    water_glasses: Optional[float] = None

    @field_validator("stress_level", "diet_score")
    @classmethod
    def clamp_0_10(cls, v):
        if v is not None:
            return max(0.0, min(10.0, v))
        return v

    def to_normalized(self) -> Dict[str, float]:
        """Convert to 0-1 normalized lifestyle dict for session_intelligence."""
        result = {}
        if self.sleep_hours is not None:
            result["sleep_quality"] = min(1.0, max(0.0, self.sleep_hours / 9.0))
        if self.stress_level is not None:
            result["stress_level"] = min(1.0, self.stress_level / 10.0)
        if self.exercise_mins_week is not None:
            result["activity_level"] = min(1.0, max(0.0, self.exercise_mins_week / 300.0))
        if self.diet_score is not None:
            result["diet_quality"] = min(1.0, self.diet_score / 10.0)
        if self.water_glasses is not None:
            result["hydration"] = min(1.0, max(0.0, self.water_glasses / 10.0))
        return result


class FullAssessmentInput(FlexibleBaseModel):
    session_id: str = "default"
    vitals: Optional[VitalSigns] = None
    body_metrics: Optional[BodyMetrics] = None
    symptoms: Optional[List[SymptomEntry]] = None
    lifestyle: Optional[LifestyleBlock] = None
    free_text: Optional[str] = None


class RealtimeAssessmentInput(FlexibleBaseModel):
    session_id: str = "default"
    vitals: Optional[VitalSigns] = None
    body_metrics: Optional[BodyMetrics] = None
    symptoms: Optional[List[SymptomEntry]] = None
    lifestyle: Optional[LifestyleBlock] = None


class FieldValidationInput(BaseModel):
    field_name: str
    value: float | int | str
