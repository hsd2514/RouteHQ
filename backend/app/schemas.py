from datetime import datetime, date

from pydantic import BaseModel, ConfigDict, EmailStr


# ---------- Auth ----------

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    status: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Vehicles ----------

class VehicleCreate(BaseModel):
    reg_number: str
    name: str
    type: str
    max_load_capacity: float
    odometer: float = 0
    acquisition_cost: float = 0
    region: str | None = None


class VehicleUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    max_load_capacity: float | None = None
    odometer: float | None = None
    acquisition_cost: float | None = None
    status: str | None = None
    region: str | None = None


class VehicleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reg_number: str
    name: str
    type: str
    max_load_capacity: float
    odometer: float
    acquisition_cost: float
    status: str
    region: str | None
    created_at: datetime


# ---------- Drivers ----------

class DriverCreate(BaseModel):
    name: str
    license_number: str
    license_category: str
    license_expiry: date
    contact_number: str
    safety_score: float = 100


class DriverUpdate(BaseModel):
    name: str | None = None
    license_category: str | None = None
    license_expiry: date | None = None
    contact_number: str | None = None
    safety_score: float | None = None
    status: str | None = None


class DriverOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    license_number: str
    license_category: str
    license_expiry: date
    contact_number: str
    safety_score: float
    status: str
    created_at: datetime


# ---------- Trips ----------

class TripCreate(BaseModel):
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: float
    planned_distance: float


class TripCompleteIn(BaseModel):
    actual_distance: float
    fuel_consumed: float
    final_odometer: float


class TripOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: float
    planned_distance: float
    actual_distance: float | None
    fuel_consumed: float | None
    fuel_efficiency: float | None
    status: str
    created_at: datetime
    dispatched_at: datetime | None
    completed_at: datetime | None


# ---------- Maintenance ----------

class MaintenanceCreate(BaseModel):
    vehicle_id: int
    issue_description: str
    cost: float = 0


class MaintenanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    issue_description: str
    cost: float
    status: str
    created_at: datetime
    closed_at: datetime | None


# ---------- Fuel / Expenses ----------

class FuelLogCreate(BaseModel):
    vehicle_id: int
    liters: float
    cost: float
    date: date


class FuelLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    liters: float
    cost: float
    date: date


class ExpenseCreate(BaseModel):
    vehicle_id: int
    type: str
    amount: float
    date: date


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    type: str
    amount: float
    date: date


# ---------- Dashboard / Reports ----------

class DashboardKpis(BaseModel):
    active_vehicles: int
    available_vehicles: int
    in_maintenance: int
    active_trips: int
    pending_trips: int
    drivers_on_duty: int
    fleet_utilization: float


class VehicleCostRow(BaseModel):
    vehicle_id: int
    reg_number: str
    name: str
    total_fuel_cost: float
    total_maintenance_cost: float
    total_expenses: float
    operational_cost: float
    avg_fuel_efficiency: float | None
    trip_count: int
