import os
import time
from dataclasses import dataclass
from typing import Dict, Optional, Tuple

import requests


TOKEN_URL = (
    "https://auth.opensky-network.org/auth/realms/opensky-network/"
    "protocol/openid-connect/token"
)
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
        self._token_expiration_timestamp: float = 0.0

    def _get_token(self) -> Optional[str]:
        """
        Devuelve un token OAuth2 de OpenSky si existen credenciales configuradas.

        Si no hay credenciales, el cliente intentará consumir la API en modo anónimo,
        que es menos fiable y tiene límites más restrictivos.
        """
        if not self.client_id or not self.client_secret:
            return None

        current_timestamp = time.time()

        if self._token and current_timestamp < self._token_expiration_timestamp:
            return self._token

        response = requests.post(
            TOKEN_URL,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
            },
            timeout=15,
        )
        response.raise_for_status()

        response_data = response.json()
        token = response_data["access_token"]
        expires_in = int(response_data.get("expires_in", 1800))

        self._token = token
        self._token_expiration_timestamp = current_timestamp + max(60, expires_in - 30)

        return token

    def _parse_meta(self, response: requests.Response) -> OpenSkyMeta:
        """
        Extrae metadatos de límite de uso si OpenSky los devuelve en cabeceras.
        """
        remaining = response.headers.get("X-Rate-Limit-Remaining")
        retry_after = response.headers.get("X-Rate-Limit-Retry-After-Seconds")

        return OpenSkyMeta(
            credits_remaining=int(remaining)
            if remaining and remaining.isdigit()
            else None,
            retry_after_seconds=int(retry_after)
            if retry_after and retry_after.isdigit()
            else None,
        )

    def get_states_bbox(
        self,
        lamin: float,
        lomin: float,
        lamax: float,
        lomax: float,
    ) -> Tuple[dict, OpenSkyMeta]:
        headers: Dict[str, str] = {}

        token = self._get_token()
        if token:
            headers["Authorization"] = f"Bearer {token}"

        response = requests.get(
            STATES_URL,
            params={
                "lamin": lamin,
                "lomin": lomin,
                "lamax": lamax,
                "lomax": lomax,
            },
            headers=headers,
            timeout=20,
        )

        meta = self._parse_meta(response)

        if response.status_code == 429:
            return {"time": None, "states": []}, meta

        response.raise_for_status()
        return response.json(), meta


opensky_client = OpenSkyClient()