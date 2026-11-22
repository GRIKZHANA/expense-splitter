from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_db, get_current_user


router = APIRouter(
    prefix="/groups",
    tags=["groups"],
)


# =====================================================
# HELPERS
# =====================================================

def _get_owner_member(
    db: Session,
    group_id: int,
    user_id: int,
):
    return (
        db.query(models.GroupMember)
        .filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.user_id == user_id,
        )
        .first()
    )


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

    # For now the registered owner controls
    # the group and its guest members.
    if group.owner_id != current_user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this group",
        )

    return group


# =====================================================
# CREATE GROUP
# =====================================================

@router.post(
    "",
    response_model=schemas.GroupOut,
)
def create_group(
    payload: schemas.GroupCreate,
    db: Session = Depends(get_db),
    current: models.User = Depends(
        get_current_user
    ),
):
    group = models.Group(
        name=payload.name.strip(),
        owner_id=current.id,
    )

    db.add(group)
    db.flush()

    # The person creating the group automatically
    # becomes Member 1.
    owner_member = models.GroupMember(
        group_id=group.id,
        member_number=1,
        name=current.name,
        user_id=current.id,
    )

    db.add(owner_member)

    db.commit()
    db.refresh(group)

    return group


# =====================================================
# LIST GROUPS
# =====================================================

@router.get(
    "",
    response_model=list[schemas.GroupOut],
)
def list_groups(
    db: Session = Depends(get_db),
    current: models.User = Depends(
        get_current_user
    ),
):
    # The logged-in user sees the groups
    # they created.
    return (
        db.query(models.Group)
        .filter(
            models.Group.owner_id == current.id
        )
        .order_by(
            models.Group.created_at.desc()
        )
        .all()
    )


# =====================================================
# ADD GUEST MEMBER BY NAME
# =====================================================

@router.post(
    "/{group_id}/members",
    response_model=schemas.MemberOut,
    status_code=201,
)
def add_member(
    group_id: int,
    payload: schemas.MemberAdd,
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

    member_name = payload.name.strip()

    if not member_name:
        raise HTTPException(
            status_code=400,
            detail="Member name is required",
        )

    # Prevent the same name from being added
    # twice to the same group.
    existing = (
        db.query(models.GroupMember)
        .filter(
            models.GroupMember.group_id
            == group_id,
            models.GroupMember.name
            == member_name,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="A member with this name already exists",
        )

    # Determine the next visible member number.
    last_member = (
        db.query(models.GroupMember)
        .filter(
            models.GroupMember.group_id
            == group_id
        )
        .order_by(
            models.GroupMember.member_number.desc()
        )
        .first()
    )

    next_number = (
        last_member.member_number + 1
        if last_member
        else 1
    )

    member = models.GroupMember(
        group_id=group_id,
        member_number=next_number,
        name=member_name,
        user_id=None,
    )

    db.add(member)
    db.commit()
    db.refresh(member)

    return schemas.MemberOut(
        id=member.id,
        member_number=member.member_number,
        name=member.name,
        is_owner=False,
    )


# =====================================================
# LIST GROUP MEMBERS
# =====================================================

@router.get(
    "/{group_id}/members",
    response_model=list[schemas.MemberOut],
)
def list_group_members(
    group_id: int,
    db: Session = Depends(get_db),
    current: models.User = Depends(
        get_current_user
    ),
):
    group = _require_group_access(
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

    return [
        schemas.MemberOut(
            id=member.id,
            member_number=member.member_number,
            name=member.name,
            is_owner=(
                member.user_id
                == group.owner_id
            ),
        )
        for member in members
    ]