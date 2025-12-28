"""Lead to patient conversion endpoints."""
from uuid import UUID
from datetime import datetime
import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import filter_by_tenant, get_current_tenant_member, get_password_hash
from app.core.email import send_welcome_email
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead as LeadModel, LeadStatus
from app.schemas.lead import LeadToPatientConversion, LeadConversionResponse

router = APIRouter()


@router.post("/{lead_id}/convert-to-patient", response_model=LeadConversionResponse)
async def convert_lead_to_patient(
    lead_id: UUID,
    conversion_data: LeadToPatientConversion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """
    Convert a lead into a patient with optional user account creation.
    Only accessible by tenant_admin, manager, user (medico), and recepcionista.
    """
    # Get the lead with tenant filtering
    lead = filter_by_tenant(
        db.query(LeadModel).filter(LeadModel.id == lead_id),
        LeadModel,
        current_user
    ).first()

    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lead no encontrado"
        )

    # Check if lead can be converted
    if lead.has_patient_account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este lead ya ha sido convertido en paciente"
        )

    # Check if lead is in a convertible state
    if lead.status in [LeadStatus.perdido, LeadStatus.no_califica, LeadStatus.rechazo_presupuesto]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede convertir un lead en estado perdido o rechazado"
        )

    # Verify email is available for user account creation
    patient_user = None
    generated_password = None
    existing_user = None

    if conversion_data.create_user_account:
        if not lead.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El lead debe tener un email para crear la cuenta de paciente"
            )

        # Check if email is already in use
        existing_user = db.query(User).filter(User.email == lead.email).first()
        if existing_user:
            # If user already exists, link it as patient
            if existing_user.tenant_id != current_user.current_tenant_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un usuario con este email en otro tenant"
                )
            patient_user = existing_user
        else:
            # Create new patient user account
            if conversion_data.password:
                password = conversion_data.password
            else:
                # Generate secure random password
                characters = string.ascii_letters + string.digits + "!@#$%^&*"
                generated_password = ''.join(secrets.choice(characters) for _ in range(12))
                password = generated_password

            hashed_password = get_password_hash(password)

            # Create patient user
            patient_user = User(
                email=lead.email,
                hashed_password=hashed_password,
                first_name=lead.first_name,
                last_name=lead.last_name,
                full_name=lead.full_name,
                phone=lead.phone,
                role=UserRole.patient,  # Patients now have dedicated patient role
                tenant_id=current_user.current_tenant_id,
                is_active=True
            )

            db.add(patient_user)
            db.flush()  # Get the user ID

    # Update lead with conversion information
    conversion_time = datetime.utcnow()
    lead.conversion_date = conversion_time
    lead.converted_by_id = current_user.id
    lead.conversion_notes = conversion_data.conversion_notes
    lead.status = LeadStatus.en_tratamiento  # Update status to in treatment

    if patient_user:
        lead.patient_user_id = patient_user.id

    # Save changes
    db.commit()
    db.refresh(lead)

    # Send welcome email if requested and user account was created
    if conversion_data.send_welcome_email and patient_user and not existing_user:
        try:
            await send_welcome_email(
                db=db,
                email_to=patient_user.email,
                user_name=patient_user.full_name or patient_user.first_name or patient_user.email.split('@')[0]
            )
        except Exception as e:
            # Log error but don't fail the conversion
            print(f"Error sending welcome email to new patient: {e}")

    return LeadConversionResponse(
        success=True,
        message=f"Lead convertido exitosamente en paciente{' con cuenta de usuario' if patient_user else ''}",
        patient_user_id=patient_user.id if patient_user else None,
        patient_email=patient_user.email if patient_user else None,
        conversion_date=conversion_time,
        generated_password=generated_password  # Only returned if generated automatically
    )
