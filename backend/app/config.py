"""Central configuration (override with environment variables)."""
import os
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
ROOT = BASE.parent
DATA_DIR = Path(os.getenv("TERAMAX_DATA", BASE / "data"))
DB_PATH = DATA_DIR / "teramax.db"
MODEL_PATH = DATA_DIR / "model.joblib"
FRONTEND_DIST = ROOT / "frontend" / "dist"
AGENT_DIR = ROOT / "agent"

PORT = int(os.getenv("TERAMAX_PORT", "8000"))
ENFORCE = os.getenv("TERAMAX_ENFORCE", "auto")      # auto | on | off  (off = simulation only)
SIM = os.getenv("TERAMAX_SIM", "0") == "1"          # demo: trust X-Teramax-Sim-IP header

AGENT_TIMEOUT = 30          # seconds without a heartbeat -> agent considered stopped
SESSION_HOURS = 12
WINDOW_HOURS = 24           # behaviour window the model looks at
ADMIN_PERSON_ID = os.getenv("TERAMAX_ADMIN_ID", "admin")
ADMIN_PASSWORD = os.getenv("TERAMAX_ADMIN_PASSWORD", "")   # empty -> random, printed once

DEFAULT_SETTINGS = {
    "auto_block_untrusted": 1,    # automatically cut internet for 'untrusted' PCs
    "auto_block_suspicious": 0,   # also cut 'suspicious' PCs
    "require_login": 1,           # portal sign-in required for internet
}
