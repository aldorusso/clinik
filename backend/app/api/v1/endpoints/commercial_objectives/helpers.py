"""Commercial objectives helper functions."""
from app.models.commercial_objectives import CommercialObjective
from app.schemas.commercial_objectives import (
    CommercialObjective as CommercialObjectiveResponse
)


def build_objective_response(objective: CommercialObjective) -> CommercialObjectiveResponse:
    """
    Build a CommercialObjectiveResponse from a CommercialObjective model.
    Handles computed fields and relationship data.
    """
    # Get commercial and creator info
    commercial_name = (
        objective.commercial.full_name or objective.commercial.email
        if objective.commercial else "Usuario eliminado"
    )
    commercial_email = objective.commercial.email if objective.commercial else ""
    created_by_name = (
        objective.created_by.full_name or objective.created_by.email
        if objective.created_by else "Usuario eliminado"
    )

    return CommercialObjectiveResponse(
        # Base fields from database
        id=objective.id,
        tenant_id=objective.tenant_id,
        commercial_id=objective.commercial_id,
        created_by_id=objective.created_by_id,
        title=objective.title,
        description=objective.description,
        type=objective.type,
        period=objective.period,
        target_value=objective.target_value,
        current_value=objective.current_value,
        unit=objective.unit,
        start_date=objective.start_date,
        end_date=objective.end_date,
        is_active=objective.is_active,
        is_public=objective.is_public,
        auto_calculate=objective.auto_calculate,
        reward_description=objective.reward_description,
        reward_amount=objective.reward_amount,
        status=objective.status,
        completion_date=objective.completion_date,
        created_at=objective.created_at,
        updated_at=objective.updated_at,
        # Computed fields
        commercial_name=commercial_name,
        commercial_email=commercial_email,
        created_by_name=created_by_name,
        progress_percentage=objective.progress_percentage,
        is_completed=objective.is_completed,
        is_overdue=objective.is_overdue,
        days_remaining=objective.days_remaining,
        period_stats=None
    )
