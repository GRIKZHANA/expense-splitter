from datetime import datetime
from typing import List

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    field_validator,
)


# =====================================================
# USERS
# =====================================================

class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(
        min_length=1,
        max_length=100,
    )
    password: str = Field(min_length=6)


class UserOut(BaseModel):
    id: int
    email: str
    name: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# =====================================================
# GROUPS
# =====================================================

class GroupCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=120,
    )


class GroupOut(BaseModel):
    id: int
    name: str
    owner_id: int

    class Config:
        from_attributes = True


# =====================================================
# GROUP MEMBERS
# =====================================================

class MemberAdd(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100,
    )


class MemberOut(BaseModel):
    id: int
    member_number: int
    name: str
    is_owner: bool = False


# =====================================================
# EXPENSE SPLITS
# =====================================================

class SplitIn(BaseModel):
    member_id: int
    share_cents: int = Field(ge=0)


# =====================================================
# CREATE EXPENSE
# =====================================================

class ExpenseCreate(BaseModel):
    description: str = Field(
        min_length=1,
        max_length=255,
    )

    paid_by_member_id: int

    amount_cents: int = Field(gt=0)

    splits: List[SplitIn]

    @field_validator("splits")
    @classmethod
    def splits_not_empty(cls, value):
        if not value:
            raise ValueError(
                "At least one split required"
            )

        return value

    def model_post_init(
        self,
        __context,
    ):
        total = sum(
            split.share_cents
            for split in self.splits
        )

        if total != self.amount_cents:
            raise ValueError(
                f"Sum of splits ({total}) "
                f"must equal amount_cents "
                f"({self.amount_cents})"
            )


# =====================================================
# EXPENSE OUTPUT
# =====================================================

class ExpenseOut(BaseModel):
    id: int
    description: str

    paid_by_member_id: int

    amount_cents: int
    created_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# BALANCES
# =====================================================

class BalanceOut(BaseModel):
    member_id: int
    member_number: int
    name: str
    net_cents: int