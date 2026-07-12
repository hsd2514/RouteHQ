from jose import JWTError
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
    create_reset_token,
    decode_reset_token,
)
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

VALID_ROLES = {"fleet_manager", "driver", "safety_officer", "financial_analyst"}


@router.post("/signup", response_model=schemas.TokenOut)
def signup(payload: schemas.UserSignup, db: Session = Depends(get_db)):
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"role must be one of {sorted(VALID_ROLES)}")

    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return schemas.TokenOut(access_token=token, user=schemas.UserOut.model_validate(user))


@router.post("/login", response_model=schemas.TokenOut)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="Account is inactive")

    token = create_access_token({"sub": str(user.id)})
    return schemas.TokenOut(access_token=token, user=schemas.UserOut.model_validate(user))


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password")
def forgot_password(payload: schemas.ForgotPasswordIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user:
        token = create_reset_token({"sub": str(user.id)})
        # Simulate sending email
        print(f"\n=== SIMULATED EMAIL ===")
        print(f"To: {user.email}")
        print(f"Subject: Reset your TransitOps password")
        print(f"Link: http://localhost:5173/reset-password?token={token}")
        print(f"=======================\n")
    # Always return a success message to prevent email enumeration
    return {"message": "If an account exists with that email, a password reset link has been sent."}


@router.post("/reset-password")
def reset_password(payload: schemas.ResetPasswordIn, db: Session = Depends(get_db)):
    try:
        token_data = decode_reset_token(payload.token)
        user_id = int(token_data.get("sub"))
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    user.password_hash = hash_password(payload.new_password)
    db.commit()

    return {"message": "Password successfully reset"}
