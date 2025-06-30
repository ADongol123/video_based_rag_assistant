from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    name:str
    email:EmailStr
    password:str
    confirm_password: str
    


class UserLogin(BaseModel):
    email:EmailStr
    password: str
    


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = 'bearer'