from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_db, get_current_user


router = APIRouter(
    prefix="/groups/{group_id}",
    tags=["expenses"],
)


# =====================================================
# HELPERS
# =====================================================

def _require_group_access(
    db: Session,
    group_id: int,
    current_user_id: int,
):
    group = db.get(models.Group, group_id)

    if not group:
        raise HTTPException(
            status_code=404,
            detail="Group not found",
        )

    if group.owner_id != current_user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this group",
        )

    return group


def _get_group_member(
    db: Session,
    group_id: int,
    member_id: int,
):
    member = (
        db.query(models.GroupMember)
        .filter(
            models.GroupMember.id == member_id,
            models.GroupMember.group_id == group_id,
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=404,
            detail=f"Group member {member_id} not found",
        )

    return member


# =====================================================
# CREATE EXPENSE
# =====================================================

@router.post(
    "/expenses",
    response_model=schemas.ExpenseOut,
    status_code=201,
)
def create_expense(
    group_id: int,
    payload: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current: models.User = Depends(
        get_current_user
    ),
):
    _require_group_access(
        db,
        group_id,
        current.id,
    )

    # Make sure payer belongs to this group.
    _get_group_member(
        db,
        group_id,
        payload.paid_by_member_id,
    )

    # Make sure every split participant
    # belongs to this group.
    for split in payload.splits:
        _get_group_member(
            db,
            group_id,
            split.member_id,
        )

    expense = models.Expense(
        group_id=group_id,
        paid_by_member_id=(
            payload.paid_by_member_id
        ),
        description=payload.description.strip(),
        amount_cents=payload.amount_cents,
    )

    db.add(expense)
    db.flush()

    for split in payload.splits:
        expense_split = models.ExpenseSplit(
            expense_id=expense.id,
            member_id=split.member_id,
            share_cents=split.share_cents,
        )

        db.add(expense_split)

    db.commit()
    db.refresh(expense)

    return expense


# =====================================================
# LIST EXPENSES
# =====================================================

@router.get(
    "/expenses",
    response_model=list[schemas.ExpenseOut],
)
def list_expenses(
    group_id: int,
    db: Session = Depends(get_db),
    current: models.User = Depends(
        get_current_user
    ),
):
    _require_group_access(
        db,
        group_id,
        current.id,
    )

    return (
        db.query(models.Expense)
        .filter(
            models.Expense.group_id == group_id
        )
        .order_by(
            models.Expense.created_at.desc()
        )
        .all()
    )


# =====================================================
# BALANCES
# =====================================================

@router.get(
    "/balances",
    response_model=list[schemas.BalanceOut],
)
def balances(
    group_id: int,
    db: Session = Depends(get_db),
    current: models.User = Depends(
        get_current_user
    ),
):
    _require_group_access(
        db,
        group_id,
        current.id,
    )

    members = (
        db.query(models.GroupMember)
        .filter(
            models.GroupMember.group_id
            == group_id
        )
        .order_by(
            models.GroupMember.member_number.asc()
        )
        .all()
    )

    # Start every group member at ₹0.
    net = defaultdict(int)

    for member in members:
        net[member.id] = 0

    expenses = (
        db.query(models.Expense)
        .filter(
            models.Expense.group_id
            == group_id
        )
        .all()
    )

    for expense in expenses:
        # Payer receives credit for the
        # entire amount they paid.
        net[
            expense.paid_by_member_id
        ] += expense.amount_cents

        # Every participant owes their share.
        for split in expense.splits:
            net[
                split.member_id
            ] -= split.share_cents

    return [
        schemas.BalanceOut(
            member_id=member.id,
            member_number=member.member_number,
            name=member.name,
            net_cents=net[member.id],
        )
        for member in members
    ]