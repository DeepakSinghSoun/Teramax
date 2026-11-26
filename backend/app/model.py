"""Teramax risk model.

5 categories (low -> high severity): trusted, normal, risky, suspicious, untrusted.

How it works
  1. `rule_label()` encodes your security policy (incl. the sudo/USB/tenure rules).
  2. `generate_dataset()` samples realistic behaviour and labels it with those rules.
  3. A RandomForest learns the policy and smooths it into probabilities / a 0-100 risk score.
  4. At run time `classify()` takes max(model, policy_floor), so your three explicit rules can
     never be "forgotten" by the model.
"""
import time

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

from .config import MODEL_PATH

LABELS = ["trusted", "normal", "risky", "suspicious", "untrusted"]
FEATURES = ["sudo_count", "usb_connected", "usb_events", "danger_count", "net_count",
            "tamper_count", "cmd_count", "tenure_days", "incident_rate"]
RISK_WEIGHTS = np.array([0, 10, 35, 70, 100])
KNOWN_DAYS = 365          # "known" user = at least a year of history ...
KNOWN_MAX_INCIDENT = 0.10  # ... and a clean record (<10% of the last 90 days had incidents)


def is_known(f) -> bool:
    return f["tenure_days"] >= KNOWN_DAYS and f["incident_rate"] < KNOWN_MAX_INCIDENT


# ---------------------------------------------------------------- policy rules
def policy_floor(f) -> tuple[int, list[str]]:
    """Your explicit rules. Returns (minimum level, reasons)."""
    sudo, usb, known = f["sudo_count"] > 0, f["usb_connected"] > 0, is_known(f)
    if sudo and usb and known:
        return 3, ["sudo used while a USB device is connected (known, clean user)"]
    if sudo and usb:
        return 4, ["sudo used with USB connected by a new/unknown user"]
    if sudo and not known:
        return 3, ["sudo used by a new/unknown user"]
    return 0, []


def score_label(f) -> int:
    """Additive risk score for everything the three rules do not cover."""
    s = min(f["danger_count"], 3) * 3 + min(f["net_count"], 4) * 1.0 + f["tamper_count"] * 5
    s += 1.0 if f["usb_connected"] else 0
    s += 1.0 if f["sudo_count"] else 0
    s += 1.0 if f["sudo_count"] >= 10 else 0
    s += min(f["incident_rate"] * 10, 3)
    s += 0 if is_known(f) else 1
    if s >= 9:
        return 4
    if s >= 5:
        return 3
    if s >= 2:
        return 2
    return 0 if (is_known(f) and s < 0.5) else 1


def rule_label(f) -> int:
    return max(score_label(f), policy_floor(f)[0])


def describe(f) -> list[str]:
    """Human-readable reasons for the dashboard."""
    out = policy_floor(f)[1][:]
    if f["danger_count"]:
        out.append(f"{f['danger_count']} dangerous command(s) (e.g. rm -rf /, reverse shell, curl|sh)")
    if f["net_count"]:
        out.append(f"{f['net_count']} network-attack/scan tool command(s) (nmap, hydra, ...)")
    if f["tamper_count"]:
        out.append(f"{f['tamper_count']} attempt(s) to hide history or stop the agent")
    if f["usb_connected"] and not out:
        out.append("USB storage connected")
    if f["incident_rate"] >= 0.1:
        out.append("user has a record of past incidents")
    if f["tenure_days"] < KNOWN_DAYS and not any("new/unknown" in r for r in out):
        out.append("user history is new (< 1 year) or unverified")
    return out


# ---------------------------------------------------------------- dataset
def generate_dataset(n=8000, seed=42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    # persona: (weight, sudo, usb_prob, danger, nettool, tamper_prob, cmds)
    personas = [(0.55, 0.15, 0.12, 0.01, 0.02, 0.00, 40),    # everyday user
                (0.20, 4.0, 0.30, 0.10, 0.30, 0.00, 120),    # admin / developer
                (0.15, 0.6, 0.30, 0.10, 0.20, 0.00, 30),     # new / curious user
                (0.10, 3.0, 0.60, 2.00, 2.00, 0.30, 60)]     # malicious
    rows = []
    for _ in range(n):
        w, sd, up, dg, nt, tp, cm = personas[rng.choice(4, p=[p[0] for p in personas])]
        new = rng.random() < 0.35
        tenure = rng.uniform(0, 364) if new else rng.uniform(365, 4000)
        incident = rng.beta(2, 5) if (rng.random() < 0.12) else rng.beta(1, 40)
        usb = int(rng.random() < up)
        rows.append({
            "sudo_count": rng.poisson(sd), "usb_connected": usb,
            "usb_events": rng.poisson(1.0) if usb else int(rng.random() < 0.05),
            "danger_count": rng.poisson(dg), "net_count": rng.poisson(nt),
            "tamper_count": int(rng.random() < tp), "cmd_count": rng.poisson(cm),
            "tenure_days": round(tenure, 1), "incident_rate": round(float(incident), 4)})
    df = pd.DataFrame(rows)
    df["level"] = df.apply(rule_label, axis=1)
    return df


# ---------------------------------------------------------------- train / use
def train(n=8000, seed=42) -> dict:
    df = generate_dataset(n, seed)
    X, y = df[FEATURES], df["level"]
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=seed, stratify=y)
    # class_weight="balanced": rare classes (e.g. 'untrusted') count more, so the forest
    # can't get a high score by just always predicting the common class.
    clf = RandomForestClassifier(n_estimators=200, class_weight="balanced",
                                 random_state=seed, n_jobs=-1)
    clf.fit(Xtr, ytr)
    pred = clf.predict(Xte)
    names = [LABELS[i] for i in sorted(set(y))]
    metrics = {
        "accuracy": round(float(accuracy_score(yte, pred)) * 100, 2),
        "samples": int(n), "trained_at": time.time(),
        "class_counts": {LABELS[int(k)]: int(v) for k, v in y.value_counts().sort_index().items()},
        "importances": {k: round(float(v), 4) for k, v in
                        sorted(zip(FEATURES, clf.feature_importances_), key=lambda t: -t[1])},
        "report": classification_report(yte, pred, target_names=names, output_dict=True, zero_division=0),
    }
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"clf": clf, "metrics": metrics}, MODEL_PATH)
    global _cache
    _cache = {"clf": clf, "metrics": metrics}
    return metrics


_cache = None


def _load():
    global _cache
    if _cache is None:
        if MODEL_PATH.exists():
            _cache = joblib.load(MODEL_PATH)
        else:
            train()
    return _cache


def model_info() -> dict:
    return _load()["metrics"]


def classify(f: dict) -> dict:
    clf = _load()["clf"]
    x = pd.DataFrame([[f[k] for k in FEATURES]], columns=FEATURES)
    proba = np.zeros(len(LABELS))
    for cls, p in zip(clf.classes_, clf.predict_proba(x)[0]):
        proba[int(cls)] = p
    floor, _ = policy_floor(f)
    level = max(int(proba.argmax()), floor)
    risk = max(float(proba @ RISK_WEIGHTS), RISK_WEIGHTS[level] * 0.8 if level >= 2 else 0)
    reasons = describe(f)
    if level >= 2 and not reasons:
        reasons = ["unusual combination of behaviour flagged by the model"]
    return {"level": level, "category": LABELS[level], "risk": round(min(risk, 100.0), 1),
            "probs": {LABELS[i]: round(float(p), 3) for i, p in enumerate(proba)},
            "reasons": reasons}


if __name__ == "__main__":
    m = train()
    print(f"accuracy {m['accuracy']}%  classes {m['class_counts']}")
    print("importances", m["importances"])
