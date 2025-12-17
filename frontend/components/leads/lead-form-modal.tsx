"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Lead, LeadCreate, LeadUpdate, LeadSource, LeadStatus, LeadPriority, User, ServiceCategory, api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

interface LeadFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  lead?: Lead | null
  mode: 'create' | 'edit'
  currentUser?: User | null
}

const sourceOptions: { value: LeadSource; label: string }[] = [
  { value: 'website', label: 'Sitio Web' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'google', label: 'Google' },
  { value: 'referidos', label: 'Referidos' },
  { value: 'llamada_directa', label: 'Llamada Directa' },
  { value: 'otros', label: 'Otros' },
]

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'calificado', label: 'Calificado' },
  { value: 'cita_agendada', label: 'Cita Agendada' },
  { value: 'en_tratamiento', label: 'En Tratamiento' },
  { value: 'completado', label: 'Completado' },
  { value: 'no_califica', label: 'No Califica' },
  { value: 'perdido', label: 'Perdido' },
  { value: 'recontactar', label: 'Recontactar' },
  { value: 'seguimiento', label: 'Seguimiento' },
  { value: 'cotizando', label: 'Cotizando' },
  { value: 'negociando', label: 'Negociando' },
  { value: 'cerrado', label: 'Cerrado' },
]

const priorityOptions: { value: LeadPriority; label: string }[] = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
]

const genderOptions = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
]

const contactMethodOptions = [
  { value: 'phone', label: 'Teléfono' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

export function LeadFormModal({ isOpen, onClose, onSuccess, lead, mode, currentUser }: LeadFormModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [doctors, setDoctors] = useState<User[]>([])
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([])

  // Form state
  const [formData, setFormData] = useState<LeadCreate>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    source: 'website',
    status: 'nuevo',
    priority: 'media',
    notes: '',
    assigned_to_id: '',
    address: '',
    city: '',
    age: undefined,
    gender: 'none',
    occupation: '',
    treatment_interest: 'none',
    budget_range: '',
    preferred_contact_method: 'none',
    preferred_contact_time: '',
    how_did_find_us: '',
    referral_source: '',
    next_follow_up_date: '',
    consultation_date: '',
  })

  // Load doctors and service categories for assignment
  useEffect(() => {
    const loadData = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        // Load doctors and service categories in parallel
        const [doctorsData, categoriesData] = await Promise.all([
          api.getMyTenantUsers(token, 'user'),
          api.getServiceCategories(token, true) // true = include all active categories
        ])
        setDoctors(doctorsData)
        setServiceCategories(categoriesData)
      } catch (error) {
        console.warn('Could not load data:', error)
        // Set empty lists - this is ok, user can assign later
        setDoctors([])
        setServiceCategories([])
      }
    }

    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  // Initialize form with lead data if editing
  useEffect(() => {
    if (mode === 'edit' && lead) {
      setFormData({
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source,
        status: lead.status,
        priority: lead.priority,
        assigned_to_id: lead.assigned_to_id || '',
        notes: lead.initial_notes || '',
        address: lead.address || '',
        city: lead.city || '',
        age: lead.age,
        gender: lead.gender || 'none',
        occupation: lead.occupation || '',
        treatment_interest: lead.treatment_interest || 'none',
        budget_range: lead.budget_range || '',
        preferred_contact_method: lead.preferred_contact_method || 'none',
        preferred_contact_time: lead.preferred_contact_time || '',
        how_did_find_us: lead.how_did_find_us || '',
        referral_source: lead.referral_source || '',
        next_follow_up_date: lead.next_follow_up_date || '',
        consultation_date: lead.consultation_date || '',
      })
    } else if (mode === 'create') {
      // Reset form for new lead
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        source: 'website',
        status: 'nuevo',
        priority: 'media',
        notes: '',
        assigned_to_id: '',
        address: '',
        city: '',
        age: undefined,
        gender: 'none',
        occupation: '',
        treatment_interest: 'none',
        budget_range: '',
        preferred_contact_method: 'none',
        preferred_contact_time: '',
        how_did_find_us: '',
        referral_source: '',
        next_follow_up_date: '',
        consultation_date: '',
      })
    }
  }, [mode, lead])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const token = auth.getToken()
    if (!token) {
      toast({
        title: "Error",
        description: "No tienes autorización para realizar esta acción",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      // Clean the form data to remove "none" values and convert to proper format
      const cleanedData = { ...formData }
      
      // Map notes to initial_notes for backend compatibility
      if (cleanedData.notes) {
        (cleanedData as any).initial_notes = cleanedData.notes
        delete cleanedData.notes
      }
      
      // Remove fields with "none" values or convert them to null/undefined
      if (cleanedData.gender === 'none') {
        delete cleanedData.gender
      }
      if (cleanedData.preferred_contact_method === 'none') {
        delete cleanedData.preferred_contact_method
      }
      if (cleanedData.treatment_interest === 'none') {
        delete cleanedData.treatment_interest
      }
      if (cleanedData.assigned_to_id === '') {
        delete cleanedData.assigned_to_id
      }
      
      // Remove empty strings for optional fields
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key as keyof typeof cleanedData] === '') {
          delete cleanedData[key as keyof typeof cleanedData]
        }
      })
      
      if (mode === 'create') {
        // Si es un comercial (closer) creando el lead y no hay assigned_to_id, auto-asignarlo
        if (currentUser?.role === 'closer' && !cleanedData.assigned_to_id && currentUser.id) {
          cleanedData.assigned_to_id = currentUser.id
        }
        await api.createLead(token, cleanedData)
        toast({
          title: "Lead creado",
          description: currentUser?.role === 'closer'
            ? "El lead ha sido creado y asignado a ti exitosamente"
            : "El lead ha sido creado exitosamente",
        })
      } else if (mode === 'edit' && lead) {
        const updateData: LeadUpdate = { ...cleanedData }
        await api.updateLead(token, lead.id, updateData)
        toast({
          title: "Lead actualizado",
          description: "El lead ha sido actualizado exitosamente",
        })
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Error al ${mode === 'create' ? 'crear' : 'actualizar'} el lead`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof LeadCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

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
          {/* Información Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                required
                placeholder="Nombre del lead"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                required
                placeholder="Apellido del lead"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+52 555 1234567"
              />
            </div>
          </div>

          {/* Clasificación */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Fuente *</Label>
              <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Asignación */}
          <div className="space-y-2">
            <Label htmlFor="assigned_to_id">Asignar a Médico</Label>
            <Select value={formData.assigned_to_id === '' ? 'unassigned' : formData.assigned_to_id} onValueChange={(value) => handleInputChange('assigned_to_id', value === 'unassigned' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar médico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.first_name} {doctor.last_name} ({doctor.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Información Personal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Edad</Label>
              <Input
                id="age"
                type="number"
                value={formData.age || ''}
                onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Edad"
                min="1"
                max="120"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Género</Label>
              <Select value={formData.gender || 'none'} onValueChange={(value) => handleInputChange('gender', value === 'none' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin especificar</SelectItem>
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Ocupación</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => handleInputChange('occupation', e.target.value)}
                placeholder="Ocupación del lead"
              />
            </div>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferred_contact_method">Método de Contacto Preferido</Label>
              <Select 
                value={formData.preferred_contact_method || 'none'} 
                onValueChange={(value) => handleInputChange('preferred_contact_method', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin especificar</SelectItem>
                  {contactMethodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_contact_time">Horario Preferido</Label>
              <Input
                id="preferred_contact_time"
                value={formData.preferred_contact_time}
                onChange={(e) => handleInputChange('preferred_contact_time', e.target.value)}
                placeholder="Ej: Mañanas, tardes, fines de semana"
              />
            </div>
          </div>

          {/* Información Médica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="treatment_interest">Interés en Tratamiento</Label>
              <Select
                value={formData.treatment_interest}
                onValueChange={(value) => handleInputChange('treatment_interest', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría de tratamiento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin especificar</SelectItem>
                  {serviceCategories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget_range">Presupuesto Estimado</Label>
              <Input
                id="budget_range"
                value={formData.budget_range}
                onChange={(e) => handleInputChange('budget_range', e.target.value)}
                placeholder="Ej: $5,000 - $10,000"
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="next_follow_up_date">Próximo Seguimiento</Label>
              <Input
                id="next_follow_up_date"
                type="datetime-local"
                value={formData.next_follow_up_date}
                onChange={(e) => handleInputChange('next_follow_up_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultation_date">Fecha de Consulta</Label>
              <Input
                id="consultation_date"
                type="datetime-local"
                value={formData.consultation_date}
                onChange={(e) => handleInputChange('consultation_date', e.target.value)}
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Notas adicionales sobre el lead..."
              rows={4}
            />
          </div>

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