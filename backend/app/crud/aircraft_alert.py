from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.aircraft_alert import AircraftAlert


def get_alerts_by_user_id(
    db_session: Session,
    user_id: int,
) -> list[AircraftAlert]:
    statement = (
        select(AircraftAlert)
        .where(AircraftAlert.user_id == user_id)
        .order_by(AircraftAlert.created_at.desc())
    )

    return list(db_session.execute(statement).scalars().all())


def create_aircraft_alert(
    db_session: Session,
    user_id: int,
    aircraft_model: str | None,
    operator_company: str | None,
) -> AircraftAlert:
    new_alert = AircraftAlert(
        user_id=user_id,
        aircraft_model=aircraft_model,
        operator_company=operator_company,
        is_active=True,
    )

    db_session.add(new_alert)
    db_session.commit()
    db_session.refresh(new_alert)

    return new_alert


def get_alert_by_id_and_user_id(
    db_session: Session,
    alert_id: int,
    user_id: int,
) -> AircraftAlert | None:
    statement = select(AircraftAlert).where(
        AircraftAlert.alert_id == alert_id,
        AircraftAlert.user_id == user_id,
    )

    return db_session.execute(statement).scalar_one_or_none()


def delete_aircraft_alert(
    db_session: Session,
    alert: AircraftAlert,
) -> None:
    db_session.delete(alert)
    db_session.commit()