from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.crud.aircraft_alert import (
    create_aircraft_alert,
    delete_aircraft_alert,
    get_alert_by_id_and_user_id,
    get_alerts_by_user_id,
)
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.aircraft_alert import (
    AircraftAlertCreateRequest,
    AircraftAlertResponse,
    AircraftAlertsListResponse,
)


router = APIRouter(prefix="/api/alerts", tags=["Aircraft alerts"])


@router.get("", response_model=AircraftAlertsListResponse)
def list_aircraft_alerts(
    current_user: User = Depends(get_current_user),
    database_session: Session = Depends(get_db),
) -> AircraftAlertsListResponse:
    alerts = get_alerts_by_user_id(
        db_session=database_session,
        user_id=current_user.user_id,
    )

    return AircraftAlertsListResponse(items=alerts)


@router.post(
    "",
    response_model=AircraftAlertResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_aircraft_alert(
    alert_data: AircraftAlertCreateRequest,
    current_user: User = Depends(get_current_user),
    database_session: Session = Depends(get_db),
) -> AircraftAlertResponse:
    if alert_data.aircraft_model is None and alert_data.operator_company is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes indicar al menos modelo de avión o compañía/callsign.",
        )

    created_alert = create_aircraft_alert(
        db_session=database_session,
        user_id=current_user.user_id,
        aircraft_model=alert_data.aircraft_model,
        operator_company=alert_data.operator_company,
    )

    return AircraftAlertResponse.model_validate(created_alert)


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_aircraft_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    database_session: Session = Depends(get_db),
) -> None:
    existing_alert = get_alert_by_id_and_user_id(
        db_session=database_session,
        alert_id=alert_id,
        user_id=current_user.user_id,
    )

    if existing_alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alerta no encontrada.",
        )

    delete_aircraft_alert(
        db_session=database_session,
        alert=existing_alert,
    )

    return None