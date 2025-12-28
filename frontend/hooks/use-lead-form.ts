"use client"

import { useState, useEffect } from "react"
import { Lead, LeadCreate, LeadUpdate, User, ServiceCategory, api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

const emptyFormData: LeadCreate = {
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
  gender: undefined,
  occupation: '',
  treatment_interest: '',
  budget_range: '',
  preferred_contact_method: undefined,
  preferred_contact_time: '',
  how_did_find_us: '',
  referral_source: '',
  next_follow_up_date: '',
  consultation_date: '',
}

interface UseLeadFormProps {
  isOpen: boolean
  lead?: Lead | null
  mode: 'create' | 'edit'
  currentUser?: User | null
  onSuccess: () => void
  onClose: () => void
}

export function useLeadForm({ isOpen, lead, mode, currentUser, onSuccess, onClose }: UseLeadFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [doctors, setDoctors] = useState<User[]>([])
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([])
  const [formData, setFormData] = useState<LeadCreate>(emptyFormData)

  // Load doctors and service categories
  useEffect(() => {
    const loadData = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        const [doctorsData, categoriesData] = await Promise.all([
          api.getMyTenantUsers(token, 'medico'),
          api.getServiceCategories(token, true)
        ])
        setDoctors(doctorsData)
        setServiceCategories(categoriesData)
      } catch (error) {
        console.warn('Could not load data:', error)
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
        gender: lead.gender,
        occupation: lead.occupation || '',
        treatment_interest: lead.treatment_interest || '',
        budget_range: lead.budget_range || '',
        preferred_contact_method: lead.preferred_contact_method,
        preferred_contact_time: lead.preferred_contact_time || '',
        how_did_find_us: lead.how_did_find_us || '',
        referral_source: lead.referral_source || '',
        next_follow_up_date: lead.next_follow_up_date || '',
        consultation_date: lead.consultation_date || '',
      })
    } else if (mode === 'create') {
      setFormData(emptyFormData)
    }
  }, [mode, lead])

  const handleInputChange = (field: keyof LeadCreate, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

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
      const cleanedData = { ...formData }

      // Map notes to initial_notes for backend compatibility
      if (cleanedData.notes) {
        (cleanedData as Record<string, unknown>).initial_notes = cleanedData.notes
        delete cleanedData.notes
      }

      // Remove undefined/empty values
      if (!cleanedData.gender) delete cleanedData.gender
      if (!cleanedData.preferred_contact_method) delete cleanedData.preferred_contact_method
      if (!cleanedData.treatment_interest) delete cleanedData.treatment_interest
      if (cleanedData.assigned_to_id === '') delete cleanedData.assigned_to_id

      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key as keyof typeof cleanedData] === '') {
          delete cleanedData[key as keyof typeof cleanedData]
        }
      })

      if (mode === 'create') {
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
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast({
        title: "Error",
        description: err.message || `Error al ${mode === 'create' ? 'crear' : 'actualizar'} el lead`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    formData,
    handleInputChange,
    handleSubmit,
    isLoading,
    doctors,
    serviceCategories
  }
}
