"""
Real Analytics Agent — PRD §6.2/FR-3.4: "Time series, anomalies vs
climatology, trend and comparison." Previously the researcher page only
displayed fixed numbers (29.4°C, +0.8°C, R²=0.942) regardless of input.
This computes real statistics — mean, standard deviation, per-day z-score
against a climatological baseline, and a least-squares trend — over
whatever series it's given, using numpy (already a declared dependency).
"""
from typing import Dict, Any, List
import numpy as np

ANOMALY_Z_THRESHOLD = 2.0  # a standard statistical significance cutoff


class AnalyticsAgent:
    @classmethod
    def compute_anomaly_series(cls, observed: List[float], climatological_mean: float) -> Dict[str, Any]:
        """
        observed: a real daily series (e.g. 30 SST readings).
        climatological_mean: the baseline to compare against (a single
        reference value, per PRD's "vs the climatological mean" framing —
        a full 30-year daily climatology isn't available in this
        environment, so the comparison baseline is the documented single
        reference mean already used elsewhere in the mock dataset).
        """
        arr = np.array(observed, dtype=float)
        n = len(arr)
        if n == 0:
            return {"error": "empty series"}

        mean = float(np.mean(arr))
        std = float(np.std(arr, ddof=1)) if n > 1 else 0.0
        anomalies = arr - climatological_mean
        z_scores = anomalies / std if std > 0 else np.zeros_like(arr)

        # Least-squares linear trend (real regression, not a hardcoded slope)
        x = np.arange(n)
        if n > 1:
            slope, intercept = np.polyfit(x, arr, 1)
            fitted = slope * x + intercept
            ss_res = float(np.sum((arr - fitted) ** 2))
            ss_tot = float(np.sum((arr - mean) ** 2))
            r_squared = round(1 - ss_res / ss_tot, 4) if ss_tot > 0 else 1.0
        else:
            slope, r_squared = 0.0, 0.0

        anomalous_days = [
            {"index": i, "value": round(float(arr[i]), 3), "anomaly": round(float(anomalies[i]), 3), "z_score": round(float(z_scores[i]), 3)}
            for i in range(n) if abs(z_scores[i]) >= ANOMALY_Z_THRESHOLD
        ]

        return {
            "n_observations": n,
            "observed_mean": round(mean, 3),
            "climatological_mean": climatological_mean,
            "mean_anomaly": round(mean - climatological_mean, 3),
            "std_dev": round(std, 3),
            "trend_per_day": round(float(slope), 4),
            "trend_r_squared": r_squared,
            "anomaly_z_threshold": ANOMALY_Z_THRESHOLD,
            "anomalous_day_count": len(anomalous_days),
            "anomalous_days": anomalous_days,
            "series": [
                {"index": i, "value": round(float(arr[i]), 3), "z_score": round(float(z_scores[i]), 3)}
                for i in range(n)
            ],
        }
