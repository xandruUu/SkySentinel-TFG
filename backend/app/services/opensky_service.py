from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from datetime import timedelta
from datetime import timezone
from json import JSONDecodeError
from threading import Lock
from typing import Any

from requests import Response
from requests import Session
from requests import exceptions as requests_exceptions

from app.core.config import settings


@dataclass(frozen=True)
class OpenSkyToken:
    access_token: str
    expires_at: datetime


class OpenSkyAuthenticationError(Exception):
    """Raised when authentication against OpenSky fails."""


class OpenSkyRequestError(Exception):
    """Raised when an OpenSky API request fails."""


class OpenSkyService:
    def __init__(
        self,
        client_id: str,
        client_secret: str,
        token_url: str,
        base_url: str,
        http_timeout_seconds: int,
    ) -> None:
        self._client_id = client_id
        self._client_secret = client_secret
        self._token_url = token_url
        self._base_url = base_url.rstrip("/")
        self._http_timeout_seconds = http_timeout_seconds

        self._http_session = Session()
        self._token_lock = Lock()
        self._cached_token: OpenSkyToken | None = None

    def _is_cached_token_valid(self) -> bool:
        if self._cached_token is None:
            return False

        now_utc = datetime.now(timezone.utc)
        token_refresh_margin = timedelta(seconds=30)
        return now_utc < (self._cached_token.expires_at - token_refresh_margin)

    def _fetch_access_token(self) -> OpenSkyToken:
        token_request_data = {
            "grant_type": "client_credentials",
            "client_id": self._client_id,
            "client_secret": self._client_secret,
        }

        try:
            token_response = self._http_session.post(
                self._token_url,
                data=token_request_data,
                timeout=self._http_timeout_seconds,
            )
            token_response.raise_for_status()
        except requests_exceptions.HTTPError as exc:
            raise OpenSkyAuthenticationError(
                "OpenSky devolvió un error HTTP al solicitar el token."
            ) from exc
        except requests_exceptions.Timeout as exc:
            raise OpenSkyAuthenticationError(
                "La solicitud del token a OpenSky agotó el tiempo de espera."
            ) from exc
        except requests_exceptions.ConnectionError as exc:
            raise OpenSkyAuthenticationError(
                "No se pudo conectar con el servidor de autenticación de OpenSky."
            ) from exc
        except requests_exceptions.RequestException as exc:
            raise OpenSkyAuthenticationError(
                "Ocurrió un error inesperado al solicitar el token de OpenSky."
            ) from exc

        try:
            token_payload = token_response.json()
        except JSONDecodeError as exc:
            raise OpenSkyAuthenticationError(
                "La respuesta del token de OpenSky no es un JSON válido."
            ) from exc

        access_token = token_payload.get("access_token")
        expires_in_seconds = token_payload.get("expires_in")

        if not isinstance(access_token, str) or not access_token:
            raise OpenSkyAuthenticationError(
                "OpenSky no devolvió un access_token válido."
            )

        if not isinstance(expires_in_seconds, int) or expires_in_seconds <= 0:
            raise OpenSkyAuthenticationError(
                "OpenSky no devolvió un expires_in válido."
            )

        expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)

        return OpenSkyToken(
            access_token=access_token,
            expires_at=expires_at,
        )

    def _get_valid_access_token(self) -> str:
        if self._is_cached_token_valid():
            return self._cached_token.access_token  # type: ignore[union-attr]

        with self._token_lock:
            if self._is_cached_token_valid():
                return self._cached_token.access_token  # type: ignore[union-attr]

            refreshed_token = self._fetch_access_token()
            self._cached_token = refreshed_token
            return refreshed_token.access_token

    @staticmethod
    def _parse_rate_limit_remaining(response: Response) -> int | None:
        remaining_header = response.headers.get("X-Rate-Limit-Remaining")
        if remaining_header is None:
            return None

        try:
            return int(remaining_header)
        except ValueError:
            return None

    @staticmethod
    def _normalize_callsign(callsign: Any) -> str | None:
        if not isinstance(callsign, str):
            return None

        normalized_callsign = callsign.strip()
        if not normalized_callsign:
            return None

        return normalized_callsign

    @staticmethod
    def _map_state_vector_to_dict(state_vector: list[Any]) -> dict[str, Any]:
        category_value: int | None = None
        if len(state_vector) > 17 and isinstance(state_vector[17], int):
            category_value = state_vector[17]

        return {
            "icao24": state_vector[0] if len(state_vector) > 0 else None,
            "callsign": OpenSkyService._normalize_callsign(
                state_vector[1] if len(state_vector) > 1 else None
            ),
            "origin_country": state_vector[2] if len(state_vector) > 2 else None,
            "time_position": state_vector[3] if len(state_vector) > 3 else None,
            "last_contact": state_vector[4] if len(state_vector) > 4 else None,
            "longitude": state_vector[5] if len(state_vector) > 5 else None,
            "latitude": state_vector[6] if len(state_vector) > 6 else None,
            "baro_altitude": state_vector[7] if len(state_vector) > 7 else None,
            "on_ground": state_vector[8] if len(state_vector) > 8 else None,
            "velocity": state_vector[9] if len(state_vector) > 9 else None,
            "true_track": state_vector[10] if len(state_vector) > 10 else None,
            "vertical_rate": state_vector[11] if len(state_vector) > 11 else None,
            "geo_altitude": state_vector[13] if len(state_vector) > 13 else None,
            "squawk": state_vector[14] if len(state_vector) > 14 else None,
            "spi": state_vector[15] if len(state_vector) > 15 else None,
            "position_source": state_vector[16] if len(state_vector) > 16 else None,
            "category": category_value,
        }

    def get_live_states(
        self,
        lamin: float,
        lomin: float,
        lamax: float,
        lomax: float,
        include_extended_data: bool = True,
        time_seconds: int | None = None,
    ) -> dict[str, Any]:
        access_token = self._get_valid_access_token()

        request_query_params: dict[str, Any] = {
            "lamin": lamin,
            "lomin": lomin,
            "lamax": lamax,
            "lomax": lomax,
        }

        if include_extended_data:
            request_query_params["extended"] = 1

        if time_seconds is not None:
            request_query_params["time"] = time_seconds

        request_headers = {
            "Authorization": f"Bearer {access_token}",
        }

        try:
            states_response = self._http_session.get(
                f"{self._base_url}/states/all",
                params=request_query_params,
                headers=request_headers,
                timeout=self._http_timeout_seconds,
            )
            states_response.raise_for_status()
        except requests_exceptions.HTTPError as exc:
            raise OpenSkyRequestError(
                "OpenSky devolvió un error HTTP al recuperar los vuelos en vivo."
            ) from exc
        except requests_exceptions.Timeout as exc:
            raise OpenSkyRequestError(
                "La solicitud a OpenSky agotó el tiempo de espera."
            ) from exc
        except requests_exceptions.ConnectionError as exc:
            raise OpenSkyRequestError(
                "No se pudo conectar con OpenSky para recuperar vuelos en vivo."
            ) from exc
        except requests_exceptions.RequestException as exc:
            raise OpenSkyRequestError(
                "Ocurrió un error inesperado al consultar OpenSky."
            ) from exc

        try:
            states_payload = states_response.json()
        except JSONDecodeError as exc:
            raise OpenSkyRequestError(
                "La respuesta de OpenSky no es un JSON válido."
            ) from exc

        response_time = states_payload.get("time")
        raw_state_vectors = states_payload.get("states")

        normalized_aircraft_states: list[dict[str, Any]] = []
        if isinstance(raw_state_vectors, list):
            for raw_state_vector in raw_state_vectors:
                if isinstance(raw_state_vector, list):
                    normalized_aircraft_states.append(
                        self._map_state_vector_to_dict(raw_state_vector)
                    )

        return {
            "source_time": response_time,
            "credits_remaining": self._parse_rate_limit_remaining(states_response),
            "aircraft_count": len(normalized_aircraft_states),
            "states": normalized_aircraft_states,
        }


opensky_service = OpenSkyService(
    client_id=settings.opensky_client_id,
    client_secret=settings.opensky_client_secret,
    token_url=settings.opensky_token_url,
    base_url=settings.opensky_base_url,
    http_timeout_seconds=settings.opensky_http_timeout_seconds,
)