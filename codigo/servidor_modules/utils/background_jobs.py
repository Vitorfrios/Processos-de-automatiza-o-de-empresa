"""Fila simples de jobs em segundo plano para tarefas pesadas."""

from __future__ import annotations

import os
import threading
import traceback
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from uuid import uuid4


class BackgroundJobManager:
    def __init__(self, max_workers=4, ttl_seconds=3600):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.ttl = timedelta(seconds=max(ttl_seconds, 300))
        self.lock = threading.Lock()
        self.jobs = {}

    def submit(self, job_type, target, metadata=None):
        job_id = uuid4().hex
        now = datetime.now().isoformat()

        with self.lock:
            self._cleanup_locked()
            self.jobs[job_id] = {
                "id": job_id,
                "job_type": str(job_type or "generic"),
                "status": "queued",
                "created_at": now,
                "updated_at": now,
                "message": "Job enfileirado.",
                "metadata": dict(metadata or {}),
            }

        self.executor.submit(self._run_job, job_id, target)
        return job_id

    def update(self, job_id, **fields):
        now = datetime.now().isoformat()
        with self.lock:
            job = self.jobs.get(job_id)
            if not job:
                return
            job.update(fields)
            job["updated_at"] = now

    def set_stage(self, job_id, stage, message=None, **extra):
        payload = {"stage": stage}
        if message is not None:
            payload["message"] = message
        payload.update(extra)
        self.update(job_id, **payload)

    def get(self, job_id):
        with self.lock:
            self._cleanup_locked()
            job = self.jobs.get(str(job_id))
            return dict(job) if job else None

    def _run_job(self, job_id, target):
        self.update(
            job_id,
            status="running",
            started_at=datetime.now().isoformat(),
            message="Processamento iniciado.",
        )

        try:
            result = target(job_id) or {}
            if not isinstance(result, dict):
                result = {"result": result}

            self.update(
                job_id,
                status="completed",
                success=True,
                completed_at=datetime.now().isoformat(),
                **result,
            )
        except Exception as exc:
            self.update(
                job_id,
                status="failed",
                success=False,
                error=str(exc),
                completed_at=datetime.now().isoformat(),
                debug_trace=traceback.format_exc(),
            )

    def _cleanup_locked(self):
        now = datetime.now()
        expired_ids = []
        for job_id, job in self.jobs.items():
            completed_at = job.get("completed_at") or job.get("updated_at") or job.get(
                "created_at"
            )
            try:
                reference_time = datetime.fromisoformat(str(completed_at))
            except Exception:
                reference_time = now

            if now - reference_time > self.ttl:
                expired_ids.append(job_id)

        for job_id in expired_ids:
            self.jobs.pop(job_id, None)


_DEFAULT_MAX_WORKERS = int(os.environ.get("ESI_BACKGROUND_WORKERS", "4") or 4)
background_jobs = BackgroundJobManager(max_workers=max(_DEFAULT_MAX_WORKERS, 2))

