// Maps complex clinical jargon to human-readable insights
export function simplifyInsight(text: string): string {
  const dictionary: Record<string, string> = {
    "high glucose variability": "Your sugar levels are unstable",
    "hypertension": "High blood pressure",
    "elevated systolic pressure": "Upper blood pressure is higher than normal",
    "elevated diastolic pressure": "Lower blood pressure is higher than normal",
    "tachycardia": "Fast resting heart rate",
    "bradycardia": "Slow resting heart rate",
    "hyperglycemia": "High blood sugar",
    "hypoglycemia": "Low blood sugar",
    "dyslipidemia": "Unhealthy fat levels in your blood",
    "metabolic syndrome": "Combination of high blood pressure, sugar, and fat",
    "anemia": "Low red blood cells (causes fatigue)",
    "hypokalemia": "Low potassium levels",
    "hyponatremia": "Low sodium levels",
    "hypercholesterolemia": "High cholesterol",
    "myocardial infarction": "Heart attack risk",
  };

  const simplified = text.toLowerCase();
  for (const [jargon, simple] of Object.entries(dictionary)) {
    if (simplified.includes(jargon)) {
      // Replace with capitalized original case later if needed, but simple return is fine for now
      return simple;
    }
  }

  return text; // Return original if no simplification rule applies
}
