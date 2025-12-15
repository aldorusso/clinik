from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, cast, Date
from typing import Optional
from datetime import datetime, date, timedelta

from app.db.session import get_db
from app.core.security import get_current_tenant_member
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus, LeadSource
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.commercial_stats import CommercialStats, CommercialOverview, MonthlyTrends, FunnelData, SourcesData, DoctorPerformance

router = APIRouter()


@router.get("/", response_model=CommercialStats)
async def get_commercial_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None)
):
    """
    Obtener estadísticas completas para usuario comercial.
    Solo usuarios con rol 'client' (comercial) pueden ver sus propias estadísticas.
    """
    
    # Solo comerciales pueden acceder a este endpoint
    if current_user.role != UserRole.client:
        # Para otros roles, mostrar estadísticas generales del tenant
        pass
    
    # Base queries
    now = datetime.utcnow()
    today = now.date()
    current_month_start = today.replace(day=1)
    last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
    last_month_end = current_month_start - timedelta(days=1)
    
    # Filtrar por comercial si es usuario comercial
    lead_query = db.query(Lead).filter(
        Lead.tenant_id == current_user.tenant_id,
        Lead.is_active == True
    )
    
    appointment_query = db.query(Appointment).filter(
        Appointment.tenant_id == current_user.tenant_id
    )
    
    if current_user.role == UserRole.client:
        lead_query = lead_query.filter(Lead.assigned_to_id == current_user.id)
        appointment_query = appointment_query.filter(Appointment.provider_id == current_user.id)
    
    # Aplicar filtros de fecha si se proporcionan
    if date_from:
        lead_query = lead_query.filter(cast(Lead.created_at, Date) >= date_from)
        appointment_query = appointment_query.filter(cast(Appointment.scheduled_at, Date) >= date_from)
    
    if date_to:
        lead_query = lead_query.filter(cast(Lead.created_at, Date) <= date_to)
        appointment_query = appointment_query.filter(cast(Appointment.scheduled_at, Date) <= date_to)
    
    # ===============================
    # OVERVIEW METRICS
    # ===============================
    
    # Total leads
    total_leads = lead_query.count()
    
    # Leads este mes
    leads_this_month = lead_query.filter(
        cast(Lead.created_at, Date) >= current_month_start
    ).count()
    
    # Tasa de conversión (leads que llegaron a en_tratamiento o completado)
    converted_leads = lead_query.filter(
        Lead.status.in_([LeadStatus.en_tratamiento, LeadStatus.completado])
    ).count()
    conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0
    
    # Pacientes activos (appointments en progreso o completadas recientemente)
    active_patients = appointment_query.filter(
        or_(
            Appointment.status == AppointmentStatus.in_progress,
            and_(
                Appointment.status == AppointmentStatus.completed,
                cast(Appointment.scheduled_at, Date) >= (today - timedelta(days=30))
            )
        )
    ).distinct(Appointment.patient_id).count()
    
    overview = CommercialOverview(
        total_leads=total_leads,
        leads_this_month=leads_this_month,
        conversion_rate=round(conversion_rate, 2),
        active_patients=active_patients
    )
    
    # ===============================
    # MONTHLY TRENDS
    # ===============================
    
    # Leads mes pasado
    leads_last_month = lead_query.filter(
        and_(
            cast(Lead.created_at, Date) >= last_month_start,
            cast(Lead.created_at, Date) <= last_month_end
        )
    ).count()
    
    # Crecimiento de leads
    leads_growth = 0.0
    if leads_last_month > 0:
        leads_growth = ((leads_this_month - leads_last_month) / leads_last_month * 100)
    elif leads_this_month > 0:
        leads_growth = 100.0  # Si no había leads el mes pasado pero hay este mes
    
    # Conversión mes pasado
    converted_last_month = lead_query.filter(
        and_(
            cast(Lead.conversion_date, Date) >= last_month_start,
            cast(Lead.conversion_date, Date) <= last_month_end,
            Lead.status.in_([LeadStatus.en_tratamiento, LeadStatus.completado])
        )
    ).count()
    
    last_month_conversion_rate = (converted_last_month / leads_last_month * 100) if leads_last_month > 0 else 0
    conversion_growth = conversion_rate - last_month_conversion_rate
    
    # Crecimiento de ingresos (simplificado basado en citas completadas)
    completed_this_month = appointment_query.filter(
        and_(
            Appointment.status == AppointmentStatus.completed,
            cast(Appointment.scheduled_at, Date) >= current_month_start
        )
    ).count()
    
    completed_last_month = appointment_query.filter(
        and_(
            Appointment.status == AppointmentStatus.completed,
            cast(Appointment.scheduled_at, Date) >= last_month_start,
            cast(Appointment.scheduled_at, Date) <= last_month_end
        )
    ).count()
    
    revenue_growth = 0.0
    if completed_last_month > 0:
        revenue_growth = ((completed_this_month - completed_last_month) / completed_last_month * 100)
    elif completed_this_month > 0:
        revenue_growth = 100.0
    
    monthly_trends = MonthlyTrends(
        leads_growth=round(leads_growth, 1),
        conversion_growth=round(conversion_growth, 1),
        revenue_growth=round(revenue_growth, 1)
    )
    
    # ===============================
    # FUNNEL DATA
    # ===============================
    
    funnel = FunnelData(
        nuevo=lead_query.filter(Lead.status == LeadStatus.nuevo).count(),
        contactado=lead_query.filter(Lead.status == LeadStatus.contactado).count(),
        calificado=lead_query.filter(Lead.status == LeadStatus.calificado).count(),
        cita_agendada=lead_query.filter(Lead.status == LeadStatus.cita_agendada).count(),
        en_tratamiento=lead_query.filter(Lead.status == LeadStatus.en_tratamiento).count(),
        completado=lead_query.filter(Lead.status == LeadStatus.completado).count()
    )
    
    # ===============================
    # SOURCES DATA
    # ===============================
    
    # Mapear fuentes a nombres más amigables
    source_mapping = {
        LeadSource.website: "website",
        LeadSource.facebook: "facebook", 
        LeadSource.referral: "referidos",
        LeadSource.google: "google",
        LeadSource.other: "otros"
    }
    
    sources_data = {
        "website": 0,
        "facebook": 0,
        "instagram": 0,  # Para mantener compatibilidad con frontend
        "referidos": 0,
        "google": 0,
        "otros": 0
    }
    
    for source_enum, source_name in source_mapping.items():
        count = lead_query.filter(Lead.source == source_enum).count()
        sources_data[source_name] = count
    
    # Instagram se agrupa con Facebook (Facebook/Instagram Ads)
    sources_data["instagram"] = sources_data["facebook"]
    
    sources = SourcesData(**sources_data)
    
    # ===============================
    # DOCTORS PERFORMANCE
    # ===============================
    
    # Obtener médicos del tenant
    doctors = db.query(User).filter(
        User.tenant_id == current_user.tenant_id,
        User.role == UserRole.user,  # user = médico
        User.is_active == True
    ).all()
    
    doctors_performance = []
    for doctor in doctors:
        doctor_leads = lead_query.filter(Lead.assigned_to_id == doctor.id).count()
        doctor_converted = lead_query.filter(
            Lead.assigned_to_id == doctor.id,
            Lead.status.in_([LeadStatus.en_tratamiento, LeadStatus.completado])
        ).count()
        doctor_conversion_rate = (doctor_converted / doctor_leads * 100) if doctor_leads > 0 else 0
        
        doctor_active_patients = appointment_query.filter(
            Appointment.provider_id == doctor.id,
            or_(
                Appointment.status == AppointmentStatus.in_progress,
                and_(
                    Appointment.status == AppointmentStatus.completed,
                    cast(Appointment.scheduled_at, Date) >= (today - timedelta(days=30))
                )
            )
        ).distinct(Appointment.patient_id).count()
        
        doctors_performance.append(DoctorPerformance(
            name=doctor.full_name or f"{doctor.first_name} {doctor.last_name}",
            leads_assigned=doctor_leads,
            conversion_rate=round(doctor_conversion_rate, 1),
            active_patients=doctor_active_patients
        ))
    
    return CommercialStats(
        overview=overview,
        monthly_trends=monthly_trends,
        funnel=funnel,
        sources=sources,
        doctors_performance=doctors_performance
    )