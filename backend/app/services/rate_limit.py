"""
LOGIN RATE LIMIT
----------------
Slows down password guessing: after LOGIN_MAX_FAILURES failed logins for the
same email from the same address within LOGIN_WINDOW_SECONDS, further
attempts are refused (HTTP 429) until the window passes. A successful login
clears the count.

Limitation (documented on purpose): the counts live in this server process's
memory. They reset when the server restarts and are not shared between
several server processes. For a real deployment, use a shared store (e.g.
Redis) or a reverse-proxy rate limit.
"""
import threading
import time
from collections import defaultdict, deque

from app.config import get_settings

_failures: dict[str, deque] = defaultdict(deque)
_lock = threading.Lock()


def _key(email: str, client: str) -> str:
    return f"{email.lower()}|{client}"


def _prune(attempts: deque, now: float, window: int) -> None:
    while attempts and now - attempts[0] > window:
        attempts.popleft()


def is_blocked(email: str, client: str) -> bool:
    settings = get_settings()
    now = time.monotonic()
    with _lock:
        attempts = _failures[_key(email, client)]
        _prune(attempts, now, settings.login_window_seconds)
        return len(attempts) >= settings.login_max_failures


def record_failure(email: str, client: str) -> None:
    with _lock:
        _failures[_key(email, client)].append(time.monotonic())


def clear(email: str, client: str) -> None:
    with _lock:
        _failures.pop(_key(email, client), None)


def reset_all() -> None:
    """Forget every count (used by the tests)."""
    with _lock:
        _failures.clear()
