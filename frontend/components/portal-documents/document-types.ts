export interface Document {
  id: string
  title: string
  category: "consent" | "prescription" | "report" | "treatment_plan" | "invoice" | "medical_record"
  date: string
  status: "pending" | "signed" | "completed"
  description: string
  file_url?: string
  file_type?: string
  file_size?: string
}

export interface Consultation {
  id: string
  date: string
  doctor_name: string
  type: string
  diagnosis: string
  notes: string
  status: string
}

export interface MedicalHistoryResponse {
  consultations: Consultation[]
  documents: {
    id: string
    name: string
    type: string
    date: string
    size: string
  }[]
  treatments: any[]
  medications: any[]
  allergies: any[]
  medical_conditions: any[]
  surgical_history: any[]
}
