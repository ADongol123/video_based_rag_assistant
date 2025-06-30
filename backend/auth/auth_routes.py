from fastapi import APIRouter, HTTPException, status
from utils.db import user_collection
from schemas.user_schemas import UserLogin,UserRegister, TokenResponse
from utils.password_hash import hash_password,verify_password
from auth.auth_handler import create_access_token, create_refresh_token
from models.user_model import UserInDB

app = APIRouter(prefix="/auth", tags=["auth"])


@app.post("/register")
async def register(user: UserRegister):
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    existing = await user_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(user.password)
    new_user = {
        "name": user.name,
        "email": user.email,
        "hashed_password": hashed_pw,
        "role": "user"
    }

    await user_collection.insert_one(new_user)
    return {"message": "User registered successfully"}

@app.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user_doc = await user_collection.find_one({"email": data.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role = user_doc.get("role", "user")

    payload = {
        "sub": str(user_doc["_id"]),
        "email": user_doc["email"],
        "role": role
    }

    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )