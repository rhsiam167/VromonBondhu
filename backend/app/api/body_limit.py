"""
REQUEST SIZE LIMIT
------------------
Rejects request bodies larger than MAX_REQUEST_BYTES (from .env) with a 413
error in the standard error format — before the app reads the whole body.
It checks the Content-Length header, and also counts bytes as they arrive
for requests that don't send one.
"""
import json


class BodySizeLimitMiddleware:
    def __init__(self, app, max_bytes: int):
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers") or [])
        declared = headers.get(b"content-length")
        if declared is not None and declared.isdigit() and int(declared) > self.max_bytes:
            await self._reject(send)
            return

        received = 0
        too_large = False

        async def limited_receive():
            nonlocal received, too_large
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > self.max_bytes:
                    too_large = True
                    raise RequestTooLarge(self.max_bytes)
            return message

        try:
            await self.app(scope, limited_receive, send)
        except RequestTooLarge:
            await self._reject(send)

    async def _reject(self, send):
        body = json.dumps(
            {"error": {"code": "request_too_large", "message": f"Request is too large (limit {self.max_bytes // 1024} KB).", "details": []}}
        ).encode()
        await send({"type": "http.response.start", "status": 413, "headers": [(b"content-type", b"application/json"), (b"content-length", str(len(body)).encode())]})
        await send({"type": "http.response.body", "body": body})


class RequestTooLarge(Exception):
    """Raised while reading a body that is over the limit (errors.py turns it into a 413)."""

    def __init__(self, max_bytes: int):
        super().__init__("Request is too large")
        self.max_bytes = max_bytes
