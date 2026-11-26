"""Password hashing (scrypt, stdlib), tokens, and a tiny login rate-limiter."""
import hashlib, hmac, os, secrets, time
from collections import defaultdict


def hash_password(pw: str) -> str:
    salt = os.urandom(16)
    h = hashlib.scrypt(pw.encode(), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return f"scrypt${salt.hex()}${h.hex()}"


def verify_password(pw: str, stored: str) -> bool:
    try:
        _, salt, h = stored.split("$")
        calc = hashlib.scrypt(pw.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1, dklen=32)
        return hmac.compare_digest(calc.hex(), h)
    except Exception:
        return False


def new_token() -> str:
    return secrets.token_urlsafe(32)


def sha256(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


class RateLimiter:
    """Allow `limit` failures per `window` seconds per key."""
    def __init__(self, limit=5, window=300):
        self.limit, self.window, self.hits = limit, window, defaultdict(list)

    def blocked(self, key) -> bool:
        now = time.time()
        self.hits[key] = [t for t in self.hits[key] if now - t < self.window]
        return len(self.hits[key]) >= self.limit

    def fail(self, key):
        self.hits[key].append(time.time())

    def reset(self, key):
        self.hits.pop(key, None)
