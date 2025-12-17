"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { PatientCard } from "@/components/patients/patient-card"
import { ScheduleAppointmentModal } from "@/components/patients/schedule-appointment-modal"
import { 
  Users, 
  Search, 
  Shield,
  Eye,
  EyeOff,
  UserCheck,
  AlertTriangle
} from "lucide-react"
import { api, User } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

interface Patient {
  id: string
  full_name: string
  first_name: string
  last_name: string
  email: string
  phone: string
  access_level: "full" | "limited" | "basic"
  can_view_details: boolean
  can_schedule: boolean
  is_active: boolean
}

export default function PacientesPage() {
  const { toast } = useToast()
  const [patients, setPatients] = useState<Patient[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  // Load current user and patients
  useEffect(() => {
    const loadData = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        // Get current user to determine access level
        const userData = await api.getCurrentUser(token)
        setCurrentUser(userData)

        // Get patients with role-based access
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/patients/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const patientsData = await response.json()
          setPatients(patientsData)
        } else {
          throw new Error('Error loading patients')
        }
      } catch (error: any) {
        console.error('Error loading data:', error)
        toast({
          title: "Error",
          description: "Error al cargar la información de pacientes",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  const filteredPatients = patients.filter(patient => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return patient.full_name.toLowerCase().includes(search) ||
           patient.first_name.toLowerCase().includes(search) ||
           patient.last_name.toLowerCase().includes(search)
  })

  const handleScheduleAppointment = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId)
    if (patient) {
      setSelectedPatient(patient)
      setIsScheduleModalOpen(true)
    }
  }

  const handleScheduleSuccess = () => {
    toast({
      title: "Cita agendada",
      description: "La cita ha sido agendada exitosamente",
    })
    setIsScheduleModalOpen(false)
    setSelectedPatient(null)
  }

  const handleViewDetails = async (patientId: string) => {
    const token = auth.getToken()
    if (!token) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/patients/${patientId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const patientDetails = await response.json()
        toast({
          title: "Detalles del Paciente",
          description: `Cargando información médica de ${patientDetails.full_name}`,
        })
        // TODO: Open patient details modal or navigate to details page
      } else {
        throw new Error('No authorized to view patient details')
      }
    } catch (error) {
      toast({
        title: "Sin Autorización",
        description: "Solo los médicos pueden ver detalles completos de pacientes",
        variant: "destructive",
      })
    }
  }

  const getAccessLevelStats = () => {
    const fullAccess = patients.filter(p => p.access_level === "full").length
    const limitedAccess = patients.filter(p => p.access_level === "limited").length
    const basicAccess = patients.filter(p => p.access_level === "basic").length
    
    return { fullAccess, limitedAccess, basicAccess }
  }

  const stats = getAccessLevelStats()
  const isDoctor = currentUser?.role === "medico"
  const isAdmin = currentUser?.role === "tenant_admin"


  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <UserCheck className="h-8 w-8" />
              Gestión de Pacientes
            </h1>
            <p className="text-muted-foreground">
              Sistema con protección de datos médicos según rol de usuario
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {patients.length} pacientes
          </div>
        </div>

        {/* Access Level Warning */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800">Protección de Datos Médicos</h3>
                <p className="text-sm text-amber-700 mt-1">
                  {isDoctor || isAdmin ? (
                    "Tienes acceso completo a la información médica de los pacientes."
                  ) : (
                    "Tu rol permite ver solo información básica. Los detalles médicos están protegidos."
                  )}
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Médicos: Acceso completo
                  </span>
                  <span className="flex items-center gap-1">
                    <EyeOff className="h-3 w-3" />
                    Otros: Solo nombres + agendamiento
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
              <p className="text-xs text-muted-foreground">En el sistema</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acceso Completo</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.fullAccess}</div>
              <p className="text-xs text-muted-foreground">Para tu rol</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acceso Limitado</CardTitle>
              <EyeOff className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.limitedAccess}</div>
              <p className="text-xs text-muted-foreground">Datos protegidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Puede Agendar</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {patients.filter(p => p.can_schedule).length}
              </div>
              <p className="text-xs text-muted-foreground">Citas disponibles</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pacientes por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Patients List */}
        <div className="space-y-4">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron pacientes</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "Intenta con otros términos de búsqueda"
                  : "No hay pacientes registrados en el sistema"
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  currentUserRole={currentUser?.role || ""}
                  onScheduleAppointment={handleScheduleAppointment}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>

        {/* Schedule Appointment Modal */}
        <ScheduleAppointmentModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          onSuccess={handleScheduleSuccess}
          patient={selectedPatient}
        />
      </div>
    </DashboardLayout>
  )
}
