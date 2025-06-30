from pydantic import BaseModel, EmailStr
from typing import Optional
class UserInDB(BaseModel):
    id:Optional[str]
    name: str
    email: EmailStr
    hashed_password: str
    role: str  # Here the role is either user or admin 