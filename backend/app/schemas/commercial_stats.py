from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime, date


class CommercialOverview(BaseModel):
    """Métricas generales del comercial"""
    total_leads: int
    leads_this_month: int
    conversion_rate: float
    active_patients: int


class MonthlyTrends(BaseModel):
    """Tendencias mensuales"""
    leads_growth: float
    conversion_growth: float
    revenue_growth: float


class FunnelData(BaseModel):
    """Datos del embudo de conversión"""
    nuevo: int
    contactado: int
    calificado: int
    cita_agendada: int
    en_tratamiento: int
    completado: int


class SourcesData(BaseModel):
    """Distribución por fuentes"""
    website: int
    facebook: int
    instagram: int
    referidos: int
    google: int
    otros: int


class DoctorPerformance(BaseModel):
    """Performance de un médico"""
    name: str
    leads_assigned: int
    conversion_rate: float
    active_patients: int


class CommercialStats(BaseModel):
    """Estadísticas completas del usuario comercial"""
    overview: CommercialOverview
    monthly_trends: MonthlyTrends
    funnel: FunnelData
    sources: SourcesData
    doctors_performance: List[DoctorPerformance]


class DateRangeFilter(BaseModel):
    """Filtro por rango de fechas"""
    date_from: Optional[date] = None
    date_to: Optional[date] = None