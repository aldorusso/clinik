"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Lead, User } from "@/lib/api"
import { useLeadForm } from "@/hooks/use-lead-form"
import {
  BasicInfoSection,
  ClassificationSection,
  AssignmentSection,
  PersonalInfoSection,
  ContactPreferencesSection,
  TreatmentSection,
  DatesSection,
  NotesSection
} from "./lead-form-sections"

interface LeadFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  lead?: Lead | null
  mode: 'create' | 'edit'
  currentUser?: User | null
}

export function LeadFormModal({ isOpen, onClose, onSuccess, lead, mode, currentUser }: LeadFormModalProps) {
  const {
    formData,
    handleInputChange,
    handleSubmit,
    isLoading,
    doctors,
    serviceCategories
  } = useLeadForm({ isOpen, lead, mode, currentUser, onSuccess, onClose })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nuevo Lead' : 'Editar Lead'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Completa la información para crear un nuevo lead'
              : 'Modifica la información del lead'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <BasicInfoSection formData={formData} onChange={handleInputChange} />
          <ClassificationSection formData={formData} onChange={handleInputChange} />
          <AssignmentSection formData={formData} onChange={handleInputChange} doctors={doctors} />
          <PersonalInfoSection formData={formData} onChange={handleInputChange} />
          <ContactPreferencesSection formData={formData} onChange={handleInputChange} />
          <TreatmentSection formData={formData} onChange={handleInputChange} serviceCategories={serviceCategories} />
          <DatesSection formData={formData} onChange={handleInputChange} />
          <NotesSection formData={formData} onChange={handleInputChange} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : mode === 'create' ? 'Crear Lead' : 'Actualizar Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
