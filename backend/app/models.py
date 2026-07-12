from datetime import datetime, date

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reg_number: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    max_load_capacity: Mapped[float] = mapped_column(Float, nullable=False)
    odometer: Mapped[float] = mapped_column(Float, default=0)
    acquisition_cost: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String, default="available")
    region: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    license_number: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    license_category: Mapped[str] = mapped_column(String, nullable=False)
    license_expiry: Mapped[date] = mapped_column(Date, nullable=False)
    contact_number: Mapped[str] = mapped_column(String, nullable=False)
    safety_score: Mapped[float] = mapped_column(Float, default=100)
    status: Mapped[str] = mapped_column(String, default="available")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source: Mapped[str] = mapped_column(String, nullable=False)
    destination: Mapped[str] = mapped_column(String, nullable=False)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), nullable=False)
    cargo_weight: Mapped[float] = mapped_column(Float, nullable=False)
    planned_distance: Mapped[float] = mapped_column(Float, nullable=False)
    actual_distance: Mapped[float | None] = mapped_column(Float, nullable=True)
    fuel_consumed: Mapped[float | None] = mapped_column(Float, nullable=True)
    fuel_efficiency: Mapped[float | None] = mapped_column(Float, nullable=True)
    revenue: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String, default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    dispatched_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False)
    issue_description: Mapped[str] = mapped_column(String, nullable=False)
    cost: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    closed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False)
    liters: Mapped[float] = mapped_column(Float, nullable=False)
    cost: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
