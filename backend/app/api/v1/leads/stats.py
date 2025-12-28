"""Lead statistics endpoints."""
from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.core.security import get_current_tenant_member
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.lead import Lead as LeadModel, LeadStatus, LeadSource, LeadPriority
from app.schemas.lead import (
    LeadStats,
    LeadFunnelStats,
    LeadSourcePerformance,
)

router = APIRouter()


@router.get("/stats/overview", response_model=LeadStats)
async def get_lead_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """Get lead statistics overview"""
    # Base query with tenant filtering
    base_query = db.query(LeadModel).filter(
        LeadModel.tenant_id == current_user.current_tenant_id,
        LeadModel.is_active == True
    )

    # Role-based filtering
    if current_user.role in [UserRole.medico, UserRole.closer]:
        base_query = base_query.filter(LeadModel.assigned_to_id == current_user.id)

    now = datetime.utcnow()
    today = now.date()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # Basic counts
    total_leads = base_query.count()
    new_leads_today = base_query.filter(func.date(LeadModel.created_at) == today).count()
    new_leads_this_week = base_query.filter(LeadModel.created_at >= week_ago).count()
    new_leads_this_month = base_query.filter(LeadModel.created_at >= month_ago).count()

    # By status
    status_counts = {}
    for lead_status in LeadStatus:
        count = base_query.filter(LeadModel.status == lead_status).count()
        status_counts[lead_status.value] = count

    # By source
    source_counts = {}
    for source in LeadSource:
        count = base_query.filter(LeadModel.source == source).count()
        source_counts[source.value] = count

    # By priority
    priority_counts = {}
    for priority in LeadPriority:
        count = base_query.filter(LeadModel.priority == priority).count()
        priority_counts[priority.value] = count

    # Conversion metrics
    converted_count = base_query.filter(LeadModel.conversion_date.isnot(None)).count()
    conversion_rate = (converted_count / total_leads * 100) if total_leads > 0 else 0

    # Average conversion time
    avg_conversion_time = None
    if converted_count > 0:
        conversion_times = base_query.filter(
            LeadModel.conversion_date.isnot(None)
        ).with_entities(
            func.avg(func.extract('epoch', LeadModel.conversion_date - LeadModel.created_at) / 86400)
        ).scalar()
        avg_conversion_time = float(conversion_times) if conversion_times else None

    # Assignment stats
    unassigned_leads = base_query.filter(LeadModel.assigned_to_id.is_(None)).count()

    # Follow-up overdue (no contact in 7 days for assigned leads)
    overdue_follow_ups = base_query.filter(
        and_(
            LeadModel.assigned_to_id.isnot(None),
            or_(
                LeadModel.last_contact_at.is_(None),
                LeadModel.last_contact_at < (now - timedelta(days=7))
            ),
            LeadModel.status.notin_([LeadStatus.completado, LeadStatus.perdido, LeadStatus.no_califica, LeadStatus.no_contesta, LeadStatus.abandono])
        )
    ).count()

    # Trends (last 30 days)
    trends = []
    for i in range(30):
        date = (now - timedelta(days=i)).date()
        count = base_query.filter(func.date(LeadModel.created_at) == date).count()
        trends.append({"date": date.isoformat(), "count": count})

    trends.reverse()  # Oldest first

    return LeadStats(
        total_leads=total_leads,
        new_leads_today=new_leads_today,
        new_leads_this_week=new_leads_this_week,
        new_leads_this_month=new_leads_this_month,
        leads_by_status=status_counts,
        leads_by_source=source_counts,
        leads_by_priority=priority_counts,
        conversion_rate=round(conversion_rate, 2),
        average_conversion_time_days=avg_conversion_time,
        unassigned_leads=unassigned_leads,
        overdue_follow_ups=overdue_follow_ups,
        leads_trend_last_30_days=trends
    )


@router.get("/stats/funnel", response_model=LeadFunnelStats)
async def get_lead_funnel_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """Get lead funnel conversion statistics"""
    # Base query with tenant filtering
    base_query = db.query(LeadModel).filter(
        LeadModel.tenant_id == current_user.current_tenant_id,
        LeadModel.is_active == True
    )

    # Role-based filtering
    if current_user.role in [UserRole.medico, UserRole.closer]:
        base_query = base_query.filter(LeadModel.assigned_to_id == current_user.id)

    # Count by each funnel stage
    nuevo = base_query.filter(LeadModel.status == LeadStatus.nuevo).count()
    contactado = base_query.filter(LeadModel.status == LeadStatus.contactado).count()
    calificado = base_query.filter(LeadModel.status == LeadStatus.calificado).count()
    cita_agendada = base_query.filter(LeadModel.status == LeadStatus.cita_agendada).count()
    vino_a_cita = base_query.filter(LeadModel.status == LeadStatus.vino_a_cita).count()
    en_tratamiento = base_query.filter(LeadModel.status == LeadStatus.en_tratamiento).count()
    completado = base_query.filter(LeadModel.status == LeadStatus.completado).count()

    # Calculate conversion rates
    total = nuevo + contactado + calificado + cita_agendada + vino_a_cita + en_tratamiento + completado

    def safe_rate(numerator, denominator):
        return round((numerator / denominator * 100), 2) if denominator > 0 else 0

    contactado_rate = safe_rate(contactado + calificado + cita_agendada + vino_a_cita + en_tratamiento + completado, total)
    calificado_rate = safe_rate(calificado + cita_agendada + vino_a_cita + en_tratamiento + completado, total)
    cita_rate = safe_rate(cita_agendada + vino_a_cita + en_tratamiento + completado, total)
    show_up_rate = safe_rate(vino_a_cita + en_tratamiento + completado, total)
    conversion_rate = safe_rate(en_tratamiento + completado, total)
    completion_rate = safe_rate(completado, total)

    return LeadFunnelStats(
        nuevo=nuevo,
        contactado=contactado,
        calificado=calificado,
        cita_agendada=cita_agendada,
        vino_a_cita=vino_a_cita,
        en_tratamiento=en_tratamiento,
        completado=completado,
        contactado_rate=contactado_rate,
        calificado_rate=calificado_rate,
        cita_rate=cita_rate,
        show_up_rate=show_up_rate,
        conversion_rate=conversion_rate,
        completion_rate=completion_rate
    )


@router.get("/stats/source-performance", response_model=List[LeadSourcePerformance])
async def get_lead_source_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_tenant_member)
):
    """Get performance statistics by lead source"""
    # Base query with tenant filtering
    base_query = db.query(LeadModel).filter(
        LeadModel.tenant_id == current_user.current_tenant_id,
        LeadModel.is_active == True
    )

    # Role-based filtering
    if current_user.role in [UserRole.medico, UserRole.closer]:
        base_query = base_query.filter(LeadModel.assigned_to_id == current_user.id)

    source_performance = []

    for source in LeadSource:
        source_leads = base_query.filter(LeadModel.source == source)
        total_leads = source_leads.count()

        if total_leads == 0:
            continue

        # Conversion count and rate
        converted_count = source_leads.filter(LeadModel.conversion_date.isnot(None)).count()
        conversion_rate = round((converted_count / total_leads * 100), 2) if total_leads > 0 else 0

        # Average lead score
        avg_score = source_leads.with_entities(func.avg(LeadModel.lead_score)).scalar()
        average_lead_score = round(float(avg_score), 2) if avg_score else 0

        source_performance.append(LeadSourcePerformance(
            source=source,
            total_leads=total_leads,
            conversion_rate=conversion_rate,
            average_lead_score=average_lead_score,
            cost_per_lead=None,  # Would need marketing cost data
            cost_per_conversion=None,  # Would need marketing cost data
            roi=None  # Would need revenue and cost data
        ))

    # Sort by conversion rate descending
    source_performance.sort(key=lambda x: x.conversion_rate, reverse=True)

    return source_performance
