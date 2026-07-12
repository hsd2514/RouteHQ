from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db
from app.deps import require_role

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("", response_model=list[schemas.ExpenseOut])
def list_expenses(
    vehicle_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Expense)
    if vehicle_id:
        query = query.filter(models.Expense.vehicle_id == vehicle_id)
    return query.order_by(models.Expense.id.desc()).all()


@router.post("", response_model=schemas.ExpenseOut, dependencies=[Depends(require_role("fleet_manager", "financial_analyst", "driver"))])
def create_expense(payload: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    expense = models.Expense(**payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense
