from fastapi import APIRouter, HTTPException, status, Request, Depends
from typing import List
from pydantic import BaseModel
from utils.db import user_collection
from schemas.user_schemas import UserLogin, UserRegister, TokenResponse,SuperAdminCreate
from utils.password_hash import hash_password, verify_password
from api.auth.auth_handler import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
)
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from models.user_model import UserInDB

app = APIRouter(prefix="/auth", tags=["auth"])
# bearer_scheme = HTTPBearer()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# Helper to extract user from token
async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload


# Role-based access dependency
def require_role(role: str):
    def role_checker(user=Depends(get_current_user)):
        if user.get("role") != role:
            raise HTTPException(status_code=403, detail="Unauthorized")
        return user
    return role_checker

@app.post("/create-superadmin")
async def create_superadmin(data: SuperAdminCreate):
    existing = await user_collection.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = hash_password(data.password)
    superadmin_doc = {
        "name": data.name,
        "email": data.email,
        "hashed_password": hashed_pw,
        "role": "superadmin",
        "admin_request": False
    }

    await user_collection.insert_one(superadmin_doc)
    return {"message": "Superadmin created successfully"}

# Register endpoint (only "user" role allowed to self-register)
@app.post("/register")
async def register(user: UserRegister):
    # Force role to "user" here to avoid bypass
    if user.role and user.role.lower() != "user":
        raise HTTPException(
            status_code=403,
            detail="Only superadmin can create admins. Use admin request endpoint instead.",
        )

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
        "role": "user",
        "admin_request": False,
        "admin_request_status": None,
    }

    await user_collection.insert_one(new_user)
    return {"message": "User registered successfully"}


# Login (unchanged)
@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    email = form_data.username
    password = form_data.password

    user_doc = await user_collection.find_one({"email": email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role = user_doc.get("role", "user")
    print(role, "role")

    payload = {
        "sub": str(user_doc["_id"]),
        "email": user_doc["email"],
        "role": role
    }

    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": role
    }



# User requests admin role
@app.post("/request-admin")
async def request_admin(user=Depends(get_current_user)):
    user_email = user.get("email")
    db_user = await user_collection.find_one({"email": user_email})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if db_user.get("role") == "admin":
        return {"message": "You are already an admin"}

    if db_user.get("admin_request_status") == "pending":
        return {"message": "Admin request is already pending"}

    # Update admin request status
    await user_collection.update_one(
        {"email": user_email},
        {"$set": {"admin_request": True, "admin_request_status": "pending"}},
    )

    return {"message": "Admin request submitted, waiting for superadmin approval"}


# Superadmin views pending admin requests
@app.get("/pending-admin-requests", dependencies=[Depends(require_role("superadmin"))])
async def pending_admin_requests():
    pending_users = await user_collection.find(
        {"admin_request_status": "pending"}
    ).to_list(length=100)
    # Format response (remove sensitive fields)
    response = []
    for u in pending_users:
        response.append(
            {
                "id": str(u["_id"]),
                "name": u["name"],
                "email": u["email"],
                "admin_request_status": u["admin_request_status"],
            }
        )
    return response


class AdminRequestApproval(BaseModel):
    user_email: str
    approve: bool


# Superadmin approves or rejects admin requests
@app.post(
    "/approve-admin-request", dependencies=[Depends(require_role("superadmin"))]
)
async def approve_admin_request(data: AdminRequestApproval):
    user_doc = await user_collection.find_one({"email": data.user_email})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    if user_doc.get("admin_request_status") != "pending":
        raise HTTPException(
            status_code=400, detail="This user does not have a pending admin request"
        )

    if data.approve:
        # Approve: update role and clear request flags
        await user_collection.update_one(
            {"email": data.user_email},
            {
                "$set": {
                    "role": "admin",
                    "admin_request_status": "approved",
                    "admin_request": False,
                }
            },
        )
        return {"message": f"User {data.user_email} promoted to admin"}

    else:
        # Reject: just update request status and clear flag
        await user_collection.update_one(
            {"email": data.user_email},
            {
                "$set": {
                    "admin_request_status": "rejected",
                    "admin_request": False,
                }
            },
        )
        return {"message": f"User {data.user_email} admin request rejected"}


@app.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    email = current_user.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user_doc = await user_collection.find_one({"email": email})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    user_doc.pop("hashed_password", None)
    user_doc["_id"] = str(user_doc["_id"])

    return user_doc