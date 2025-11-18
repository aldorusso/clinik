from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_admin_user
from app.db.session import get_db
from app.models.email_template import EmailTemplate, EmailTemplateType
from app.models.user import User
from app.schemas.email_template import (
    EmailTemplate as EmailTemplateSchema,
    EmailTemplateCreate,
    EmailTemplateUpdate
)

router = APIRouter()


@router.get("/", response_model=List[EmailTemplateSchema])
async def list_email_templates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """List all email templates. Admin only."""
    templates = db.query(EmailTemplate).offset(skip).limit(limit).all()
    return templates


@router.get("/{template_id}", response_model=EmailTemplateSchema)
async def get_email_template(
    template_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Get a specific email template by ID. Admin only."""
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    return template


@router.get("/type/{template_type}", response_model=EmailTemplateSchema)
async def get_email_template_by_type(
    template_type: EmailTemplateType,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Get email template by type. Admin only."""
    template = db.query(EmailTemplate).filter(
        EmailTemplate.template_type == template_type
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template for type '{template_type}' not found"
        )

    return template


@router.post("/", response_model=EmailTemplateSchema, status_code=status.HTTP_201_CREATED)
async def create_email_template(
    template_in: EmailTemplateCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Create a new email template. Admin only."""
    # Check if template type already exists
    existing = db.query(EmailTemplate).filter(
        EmailTemplate.template_type == template_in.template_type
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Template for type '{template_in.template_type}' already exists"
        )

    template = EmailTemplate(**template_in.model_dump())
    db.add(template)
    db.commit()
    db.refresh(template)

    return template


@router.put("/{template_id}", response_model=EmailTemplateSchema)
async def update_email_template(
    template_id: UUID,
    template_in: EmailTemplateUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Update an email template. Admin only."""
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Update fields
    update_data = template_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)

    db.commit()
    db.refresh(template)

    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_email_template(
    template_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Delete an email template. Admin only."""
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    db.delete(template)
    db.commit()

    return None


@router.get("/preview/{template_type}")
async def preview_email_template(
    template_type: EmailTemplateType,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Preview an email template with sample data. Admin only."""
    template = db.query(EmailTemplate).filter(
        EmailTemplate.template_type == template_type
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template for type '{template_type}' not found"
        )

    # Sample data for preview
    from jinja2 import Template
    from datetime import datetime

    sample_data = {
        "project_name": "Scraper API",
        "user_name": "Juan Pérez",
        "reset_url": "http://localhost:3002/reset-password?token=sample-token-12345",
        "expire_hours": 24,
        "current_year": datetime.now().year,
        "message": "Este es un mensaje de ejemplo para la plantilla de notificación."
    }

    try:
        jinja_template = Template(template.html_content)
        rendered_html = jinja_template.render(**sample_data)

        return {
            "subject": template.subject,
            "html_content": rendered_html,
            "sample_data": sample_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error rendering template: {str(e)}"
        )
