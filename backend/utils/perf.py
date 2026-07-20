"""Lightweight performance timing helpers for ResearchPilot."""
from __future__ import annotations

import logging
import time
from contextlib import contextmanager
from typing import Generator, Optional

logger = logging.getLogger("researchpilot.perf")


class PerfTimer:
    """Accumulates named stage timings for a single request."""

    def __init__(self, label: str = "request"):
        self.label = label
        self.t0 = time.perf_counter()
        self.stages: dict[str, float] = {}
        self.first_event_ms: Optional[float] = None

    def mark_first_event(self) -> None:
        if self.first_event_ms is None:
            self.first_event_ms = (time.perf_counter() - self.t0) * 1000
            print(f"[PERF] Time to first SSE event: {self.first_event_ms:.0f}ms")
            logger.info("[PERF] Time to first SSE event: %.0fms", self.first_event_ms)

    def record(self, name: str, elapsed_s: float) -> None:
        self.stages[name] = elapsed_s
        if elapsed_s < 1:
            print(f"[PERF] {name}: {elapsed_s * 1000:.0f}ms")
        else:
            print(f"[PERF] {name}: {elapsed_s:.1f}s")

    @contextmanager
    def stage(self, name: str) -> Generator[None, None, None]:
        start = time.perf_counter()
        try:
            yield
        finally:
            self.record(name, time.perf_counter() - start)

    def total(self) -> float:
        return time.perf_counter() - self.t0

    def log_total(self) -> None:
        total = self.total()
        print(f"[PERF] Total: {total:.1f}s")
        logger.info("[PERF] Total: %.1fs | stages=%s", total, {k: round(v, 3) for k, v in self.stages.items()})
