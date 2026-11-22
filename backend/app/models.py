from datetime import datetime
from typing import Optional

from sqlalchemy import (
    String,
    Integer,
    ForeignKey,
    DateTime,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from .database import Base


# =====================================================
# USER
# =====================================================

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100)
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255)
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )


# =====================================================
# GROUP
# =====================================================

class Group(Base):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        String(120)
    )

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    members = relationship(
        "GroupMember",
        back_populates="group",
        cascade="all, delete-orphan",
    )

    expenses = relationship(
        "Expense",
        back_populates="group",
        cascade="all, delete-orphan",
    )


# =====================================================
# GROUP MEMBER
# =====================================================

class GroupMember(Base):
    __tablename__ = "group_members"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    group_id: Mapped[int] = mapped_column(
        ForeignKey("groups.id")
    )

    # Visible number inside this group:
    # 1, 2, 3, 4...
    member_number: Mapped[int] = mapped_column(
        Integer
    )

    # Guest member name.
    # They do NOT need a SplitEase account.
    name: Mapped[str] = mapped_column(
        String(100)
    )

    # Optional registered SplitEase account.
    # The group creator is linked here.
    # Guest members can have NULL.
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    group = relationship(
        "Group",
        back_populates="members",
    )


# =====================================================
# EXPENSE
# =====================================================

class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    group_id: Mapped[int] = mapped_column(
        ForeignKey("groups.id")
    )

    # References GroupMember rather than User.
    paid_by_member_id: Mapped[int] = mapped_column(
        ForeignKey("group_members.id")
    )

    description: Mapped[str] = mapped_column(
        String(255)
    )

    amount_cents: Mapped[int] = mapped_column(
        Integer
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    group = relationship(
        "Group",
        back_populates="expenses",
    )

    splits = relationship(
        "ExpenseSplit",
        back_populates="expense",
        cascade="all, delete-orphan",
    )


# =====================================================
# EXPENSE SPLIT
# =====================================================

class ExpenseSplit(Base):
    __tablename__ = "expense_splits"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    expense_id: Mapped[int] = mapped_column(
        ForeignKey("expenses.id")
    )

    # References a saved member of the group.
    member_id: Mapped[int] = mapped_column(
        ForeignKey("group_members.id")
    )

    share_cents: Mapped[int] = mapped_column(
        Integer
    )

    expense = relationship(
        "Expense",
        back_populates="splits",
    )