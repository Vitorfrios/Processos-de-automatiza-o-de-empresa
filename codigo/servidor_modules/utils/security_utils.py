"""Utilitarios de seguranca para sessao HTTP assinada."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from http import cookies


class SessionSecurity:
    """Cria e valida cookies de sessao assinados sem persistencia em disco."""

    COOKIE_NAME = "esi_auth"

    def __init__(self, project_root):
        self.project_root = str(project_root)
        self.secret = self._build_secret()

    def _build_secret(self):
        configured = os.environ.get("ESI_SESSION_SECRET", "").strip()
        if configured:
            return configured.encode("utf-8")

        fallback_seed = "::".join(
            [
                "esi",
                self.project_root,
                os.name,
                os.environ.get("USERNAME", ""),
                os.environ.get("COMPUTERNAME", ""),
                os.environ.get("PROCESSOR_IDENTIFIER", ""),
                "v2",
            ]
        )
        return hashlib.sha256(fallback_seed.encode("utf-8")).digest()

    def _encode(self, payload):
        raw = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode(
            "utf-8"
        )
        return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")

    def _decode(self, value):
        padded = value + "=" * (-len(value) % 4)
        decoded = base64.urlsafe_b64decode(padded.encode("ascii"))
        return json.loads(decoded.decode("utf-8"))

    def _sign(self, encoded_payload):
        digest = hmac.new(
            self.secret,
            encoded_payload.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")

    def create_signed_token(self, session_payload, ttl_seconds=43200):
        now = int(time.time())
        payload = dict(session_payload or {})
        payload["iat"] = now
        payload["exp"] = now + max(int(ttl_seconds), 60)

        encoded_payload = self._encode(payload)
        signature = self._sign(encoded_payload)
        return f"{encoded_payload}.{signature}", payload

    def decode_signed_token(self, token):
        if not token or "." not in token:
            return None

        encoded_payload, signature = token.split(".", 1)
        expected_signature = self._sign(encoded_payload)
        if not hmac.compare_digest(signature, expected_signature):
            return None

        try:
            payload = self._decode(encoded_payload)
        except Exception:
            return None

        if int(payload.get("exp", 0)) < int(time.time()):
            return None

        return payload

    def extract_cookie_value(self, cookie_header, cookie_name=None):
        if not cookie_header:
            return None

        jar = cookies.SimpleCookie()
        try:
            jar.load(cookie_header)
        except cookies.CookieError:
            return None

        morsel = jar.get(cookie_name or self.COOKIE_NAME)
        return morsel.value if morsel else None

    def get_session_from_cookie_header(self, cookie_header, cookie_name=None):
        token = self.extract_cookie_value(cookie_header, cookie_name=cookie_name)
        if not token:
            return None
        return self.decode_signed_token(token)

    def build_set_cookie_header(
        self,
        token,
        max_age=43200,
        cookie_name=None,
        http_only=True,
        same_site="Strict",
        secure=False,
    ):
        cookie = cookies.SimpleCookie()
        key = cookie_name or self.COOKIE_NAME
        cookie[key] = token
        cookie[key]["path"] = "/"
        cookie[key]["max-age"] = str(max(int(max_age), 0))
        cookie[key]["samesite"] = same_site

        if http_only:
            cookie[key]["httponly"] = True
        if secure:
            cookie[key]["secure"] = True

        return cookie.output(header="").strip()

    def build_clear_cookie_header(self, cookie_name=None, same_site="Strict"):
        return self.build_set_cookie_header(
            "",
            max_age=0,
            cookie_name=cookie_name,
            same_site=same_site,
        )
