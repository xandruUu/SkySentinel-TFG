from sqlalchemy import String
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from app.db.database import Base


class LogisticTeam(Base):
    __tablename__ = "logistic_team"

    team_id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    team_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )