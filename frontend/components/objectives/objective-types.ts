import {
  CommercialObjective,
  ObjectiveType,
  ObjectivePeriod,
  CommercialDashboard
} from "@/lib/api"

export type { CommercialObjective, ObjectiveType, ObjectivePeriod, CommercialDashboard }

export interface ProgressFormData {
  increment: number
  notes: string
}
