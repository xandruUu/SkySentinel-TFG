import os
import time
from dataclasses import dataclass
from typing import Dict, Optional, Tuple

import requests


TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token"
STATES_URL = "https://opensky-network.org/api/states/all"


@dataclass
class OpenSkyMeta:
    credits_remaining: Optional[int]
    retry_after_seconds: Optional[int]


class OpenSkyClient:
    def __init__(self) -> None:
        self.client_id = os.environ.get("OPENSKY_CLIENT_ID")
        self.client_secret = os.environ.get("OPENSKY_CLIENT_SECRET")

        self._token: Optional[str] = None
        self._token_exp: float = 0.0

    def _get_token(self) -> Optional[str]:
        # Si no hay credenciales, intentaremos anónimo (menos fiable)
        if not self.client_id or not self.client_secret:
            return None

        now = time.time()
        if self._token and now < self._token_exp:
            return self._token

        r = requests.post(
            TOKEN_URL,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
            },
            timeout=15,
        )
        r.raise_for_status()
        data = r.json()
        token = data["access_token"]
        expires_in = int(data.get("expires_in", 1800))
        # margen para renovar antes
        self._token = token
        self._token_exp = now + max(60, expires_in - 30)
        return token

    def _parse_meta(self, resp: requests.Response) -> OpenSkyMeta:
        # OpenSky doc: X-Rate-Limit-Remaining y X-Rate-Limit-Retry-After-Seconds. citeturn13search3
        remaining = resp.headers.get("X-Rate-Limit-Remaining")
        retry_after = resp.headers.get("X-Rate-Limit-Retry-After-Seconds")

        return OpenSkyMeta(
            credits_remaining=int(remaining) if remaining and remaining.isdigit() else None,
            retry_after_seconds=int(retry_after) if retry_after and retry_after.isdigit() else None,
        )

    def get_states_bbox(self, lamin: float, lomin: float, lamax: float, lomax: float) -> Tuple[dict, OpenSkyMeta]:
        headers: Dict[str, str] = {}
        token = self._get_token()
        if token:
            headers["Authorization"] = f"Bearer {token}"

        r = requests.get(
            STATES_URL,
            params={"lamin": lamin, "lomin": lomin, "lamax": lamax, "lomax": lomax},
            headers=headers,
            timeout=20,
        )

        meta = self._parse_meta(r)

        # Si llegas a rate limit: 429 + retry header. citeturn13search3
        if r.status_code == 429:
            # Devolvemos payload vacío para no romper frontend
            return {"time": None, "states": []}, meta

        r.raise_for_status()
        return r.json(), meta


opensky_client = OpenSkyClient()
