"""
ML Pipeline Service v2.0 for AetherDx AI.
Hybrid AI Engine: XGBoost (primary) + RandomForest + LogisticRegression + NaiveBayes + DecisionTree.
XGBoost excels at tabular clinical data with built-in regularization.
"""

import numpy as np
import pickle
import os
from typing import Dict, List, Tuple, Optional
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except Exception:
    HAS_XGBOOST = False
    print("⚠️ XGBoost not available — using GradientBoosting as fallback")


from data.symptoms_data import generate_synthetic_dataset, DISEASE_LABELS, SYMPTOM_FEATURES

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "health_model.pkl")


class HealthMLPipeline:
    """Hybrid multi-model health prediction pipeline with XGBoost as primary."""

    def __init__(self):
        self.models = {}
        self.primary_model = None
        self.is_trained = False
        self.accuracy_scores = {}
        self.primary_model_name = ""

    def train(self):
        """Train all models on synthetic data."""
        print("🧪 Generating synthetic training data...")
        X, y = generate_synthetic_dataset(n_samples=2000)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        # Initialize models — XGBoost as primary
        self.models = {}

        if HAS_XGBOOST:
            self.models["xgboost"] = XGBClassifier(
                n_estimators=200,
                max_depth=8,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                reg_alpha=0.1,
                reg_lambda=1.0,
                random_state=42,
                eval_metric="mlogloss",
                use_label_encoder=False,
            )
        else:
            self.models["gradient_boosting"] = GradientBoostingClassifier(
                n_estimators=200,
                max_depth=8,
                learning_rate=0.1,
                subsample=0.8,
                random_state=42,
            )

        self.models["random_forest"] = RandomForestClassifier(
            n_estimators=200, max_depth=15, random_state=42, n_jobs=-1
        )
        self.models["logistic_regression"] = LogisticRegression(
            max_iter=1000, random_state=42
        )
        self.models["naive_bayes"] = GaussianNB()
        self.models["decision_tree"] = DecisionTreeClassifier(
            max_depth=12, random_state=42
        )

        # Train each model
        for name, model in self.models.items():
            print(f"  Training {name}...")
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            acc = accuracy_score(y_test, y_pred)
            self.accuracy_scores[name] = acc
            print(f"  ✅ {name} accuracy: {acc:.4f}")

        # Set primary model (XGBoost preferred)
        if HAS_XGBOOST and "xgboost" in self.models:
            self.primary_model = self.models["xgboost"]
            self.primary_model_name = "XGBoost"
        elif "gradient_boosting" in self.models:
            self.primary_model = self.models["gradient_boosting"]
            self.primary_model_name = "GradientBoosting"
        else:
            self.primary_model = self.models["random_forest"]
            self.primary_model_name = "RandomForest"

        self.is_trained = True
        self._save_model()
        print(f"✨ ML Pipeline ready! Primary model: {self.primary_model_name}")

    def _save_model(self):
        """Persist the trained pipeline."""
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        with open(MODEL_PATH, "wb") as f:
            pickle.dump({
                "models": self.models,
                "accuracy_scores": self.accuracy_scores,
                "primary_model_name": self.primary_model_name,
            }, f)

    def _load_model(self) -> bool:
        """Load persisted model if available."""
        if os.path.exists(MODEL_PATH):
            try:
                with open(MODEL_PATH, "rb") as f:
                    data = pickle.load(f)
                    self.models = data["models"]
                    self.accuracy_scores = data["accuracy_scores"]
                    self.primary_model_name = data.get("primary_model_name", "")

                    # Resolve primary model
                    if "xgboost" in self.models:
                        self.primary_model = self.models["xgboost"]
                        self.primary_model_name = "XGBoost"
                    elif "gradient_boosting" in self.models:
                        self.primary_model = self.models["gradient_boosting"]
                        self.primary_model_name = "GradientBoosting"
                    else:
                        self.primary_model = self.models["random_forest"]
                        self.primary_model_name = "RandomForest"

                    self.is_trained = True
                    print(f"📦 Loaded pre-trained model from disk ({self.primary_model_name})")
                    return True
            except Exception as e:
                print(f"⚠️ Failed to load model: {e} — will retrain")
        return False

    def initialize(self):
        """Load existing model or train new one."""
        if not self._load_model():
            self.train()

    def predict(self, feature_vector: np.ndarray) -> Dict:
        """
        Run prediction using the primary model.
        Returns probability distribution and top predictions.
        """
        if not self.is_trained:
            raise RuntimeError("Model not trained. Call initialize() first.")

        features = feature_vector.reshape(1, -1)

        # Get probability distribution from primary model
        probabilities = self.primary_model.predict_proba(features)[0]

        # Build results sorted by probability
        predictions = []
        for class_idx in np.argsort(probabilities)[::-1]:
            disease_name = DISEASE_LABELS.get(class_idx, f"Unknown_{class_idx}")
            prob = float(probabilities[class_idx])

            if prob >= 0.6:
                risk_tier = "HIGH"
                risk_color = "red"
            elif prob >= 0.3:
                risk_tier = "MODERATE"
                risk_color = "amber"
            else:
                risk_tier = "LOW"
                risk_color = "green"

            predictions.append({
                "condition": disease_name,
                "probability": round(prob * 100, 1),
                "risk_tier": risk_tier,
                "risk_color": risk_color,
            })

        # Get ensemble agreement
        top_condition_idx = np.argmax(probabilities)
        agreement_count = 0
        for name, model in self.models.items():
            try:
                pred = model.predict(features)[0]
                if pred == top_condition_idx:
                    agreement_count += 1
            except Exception:
                pass

        return {
            "predictions": predictions[:3],
            "all_probabilities": {
                DISEASE_LABELS[i]: round(float(p) * 100, 1)
                for i, p in enumerate(probabilities)
            },
            "primary_prediction": predictions[0]["condition"],
            "primary_probability": predictions[0]["probability"],
            "primary_risk_tier": predictions[0]["risk_tier"],
            "model_agreement": f"{agreement_count}/{len(self.models)}",
            "model_used": f"{self.primary_model_name} (n={getattr(self.primary_model, 'n_estimators', 'N/A')})",
        }

    def get_feature_importances(self) -> List[Tuple[str, float]]:
        """Extract feature importances from the primary model."""
        if not self.is_trained:
            return []

        try:
            importances = self.primary_model.feature_importances_
        except AttributeError:
            # Fallback for models without feature_importances_
            return [(f, 0.0) for f in SYMPTOM_FEATURES]

        feature_importance_pairs = [
            (SYMPTOM_FEATURES[i], float(importances[i]))
            for i in range(min(len(SYMPTOM_FEATURES), len(importances)))
        ]
        feature_importance_pairs.sort(key=lambda x: x[1], reverse=True)
        return feature_importance_pairs

    def get_model_info(self) -> Dict:
        """Get detailed model information for the dashboard."""
        return {
            "primary_model": self.primary_model_name,
            "total_models": len(self.models),
            "has_xgboost": HAS_XGBOOST,
            "model_scores": {
                name: round(score * 100, 1)
                for name, score in self.accuracy_scores.items()
            },
            "features_count": len(SYMPTOM_FEATURES),
        }


# Singleton instance
ml_pipeline = HealthMLPipeline()
