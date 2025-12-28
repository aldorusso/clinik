import { Document, MedicalHistoryResponse } from "./document-types"

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function transformMedicalHistoryToDocuments(
  medicalHistory: MedicalHistoryResponse,
  treatments: any[]
): Document[] {
  // Convertir documentos médicos a formato Document
  const documentsFromHistory: Document[] = medicalHistory.documents.map(doc => ({
    id: doc.id,
    title: doc.name,
    category: "medical_record" as const,
    date: doc.date,
    status: "completed" as const,
    description: `Documento médico - ${doc.type}`,
    file_url: `/api/v1/documents/${doc.id}/download`,
    file_type: doc.type,
    file_size: doc.size
  }))

  // Convertir consultas a documentos de reporte
  const consultsAsDocuments: Document[] = medicalHistory.consultations.map(consultation => ({
    id: consultation.id,
    title: `Informe de Consulta - ${consultation.type}`,
    category: "report" as const,
    date: consultation.date,
    status: "completed" as const,
    description: consultation.diagnosis || consultation.notes || "Consulta médica completada",
    file_url: `/api/v1/consultations/${consultation.id}/report`,
    file_type: "pdf"
  }))

  // Generar documentos de plan de tratamiento
  const treatmentDocuments: Document[] = treatments.map(treatment => ({
    id: `treatment-${treatment.id}`,
    title: `Plan de Tratamiento - ${treatment.name}`,
    category: "treatment_plan" as const,
    date: treatment.start_date,
    status: "completed" as const,
    description: treatment.description || `Plan para ${treatment.name}`,
    file_url: `/api/v1/treatments/${treatment.id}/plan`,
    file_type: "pdf"
  }))

  // Agregar consentimientos pendientes para tratamientos activos
  const pendingConsents: Document[] = []
  const activeTreatments = treatments.filter(t => t.status === 'active')
  activeTreatments.slice(0, 2).forEach((treatment) => {
    pendingConsents.push({
      id: `consent-${treatment.id}`,
      title: `Consentimiento Informado - ${treatment.name}`,
      category: "consent" as const,
      date: new Date().toISOString(),
      status: "pending" as const,
      description: `Consentimiento requerido para ${treatment.name}`,
      file_type: "pdf"
    })
  })

  return [
    ...documentsFromHistory,
    ...consultsAsDocuments,
    ...treatmentDocuments,
    ...pendingConsents
  ]
}

export function handleViewDocument(document: Document): void {
  if (document.file_url) {
    window.open(document.file_url, '_blank')
  }
}

export function handleDownloadDocument(document: Document): void {
  if (document.file_url) {
    const link = window.document.createElement('a')
    link.href = document.file_url
    link.download = `${document.title}.pdf`
    link.click()
  }
}
