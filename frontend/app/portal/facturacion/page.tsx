"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientPortalLayout } from "@/components/dashboard/client-portal-layout"
import { 
  CreditCard, 
  Calendar,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Receipt
} from "lucide-react"
import { api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function PatientBillingPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [billingData, setBillingData] = useState<any>({
    invoices: [],
    payments: [],
    outstanding_balance: 0,
    total_paid: 0,
    total_billed: 0
  })

  useEffect(() => {
    const loadBillingData = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        // TODO: Implement patient billing API
        // const response = await api.get('/api/v1/billing/my-billing', token)
        // setBillingData(response)
        
        // Mock data for now
        setBillingData({
          outstanding_balance: 400,
          total_paid: 1200,
          total_billed: 1600,
          invoices: [
            {
              id: "INV-2024-001",
              date: "2024-12-01",
              due_date: "2024-12-15",
              amount: 400,
              paid_amount: 0,
              status: "pending",
              treatment: "Rejuvenecimiento Facial - Sesión 2",
              doctor_name: "Dr. Carlos Mendez",
              description: "Segunda sesión de tratamiento con Botox"
            },
            {
              id: "INV-2024-002",
              date: "2024-11-25",
              due_date: "2024-12-10",
              amount: 400,
              paid_amount: 400,
              status: "paid",
              treatment: "Rejuvenecimiento Facial - Sesión 1",
              doctor_name: "Dr. Carlos Mendez",
              description: "Primera sesión de tratamiento con Botox",
              payment_date: "2024-11-26",
              payment_method: "Tarjeta de Crédito"
            },
            {
              id: "INV-2024-003",
              date: "2024-10-15",
              due_date: "2024-10-30",
              amount: 800,
              paid_amount: 800,
              status: "paid",
              treatment: "Limpieza Facial Profunda - Completo",
              doctor_name: "Dr. María García",
              description: "Tratamiento completo de limpieza facial (4 sesiones)",
              payment_date: "2024-10-20",
              payment_method: "Transferencia Bancaria"
            }
          ],
          payments: [
            {
              id: "PAY-001",
              date: "2024-11-26",
              amount: 400,
              method: "Tarjeta de Crédito",
              reference: "****1234",
              invoice_id: "INV-2024-002",
              status: "completed"
            },
            {
              id: "PAY-002",
              date: "2024-10-20",
              amount: 800,
              method: "Transferencia Bancaria",
              reference: "TRF789456",
              invoice_id: "INV-2024-003",
              status: "completed"
            }
          ]
        })
        
        setLoading(false)
      } catch (error: any) {
        console.error('Error loading billing data:', error)
        toast({
          title: "Error",
          description: "Error al cargar la información de facturación",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadBillingData()
  }, [toast])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-green-100 text-green-800">Pagada</Badge>
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "overdue":
        return <Badge variant="destructive">Vencida</Badge>
      case "cancelled":
        return <Badge variant="outline">Cancelada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const pendingInvoices = billingData.invoices.filter((inv: any) => inv.status === "pending")
  const paidInvoices = billingData.invoices.filter((inv: any) => inv.status === "paid")

  if (loading) {
    return (
      <ClientPortalLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ClientPortalLayout>
    )
  }

  return (
    <ClientPortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-blue-500" />
              Facturación y Pagos
            </h1>
            <p className="text-muted-foreground">
              Gestiona tus facturas, pagos y estado de cuenta
            </p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Estado de Cuenta
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo Pendiente</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(billingData.outstanding_balance)}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Pagado</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(billingData.total_paid)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Facturado</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(billingData.total_billed)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invoices" className="space-y-6">
          <TabsList>
            <TabsTrigger value="invoices">Facturas</TabsTrigger>
            <TabsTrigger value="payments">Historial de Pagos</TabsTrigger>
          </TabsList>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            {/* Pending Invoices */}
            {pendingInvoices.length > 0 && (
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertCircle className="h-5 w-5" />
                    Facturas Pendientes
                  </CardTitle>
                  <CardDescription>
                    Facturas que requieren pago
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingInvoices.map((invoice: any) => (
                      <div key={invoice.id} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(invoice.status)}
                            <div>
                              <h3 className="font-semibold flex items-center gap-2">
                                {invoice.id}
                                {getStatusBadge(invoice.status)}
                              </h3>
                              <p className="text-sm text-muted-foreground">{invoice.treatment}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-orange-800">
                              {formatCurrency(invoice.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Vence: {formatDate(invoice.due_date)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <span className="font-medium">Fecha de Factura: </span>
                            <span>{formatDate(invoice.date)}</span>
                          </div>
                          <div>
                            <span className="font-medium">Doctor: </span>
                            <span>{invoice.doctor_name}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm mb-4 p-2 bg-white rounded border">
                          {invoice.description}
                        </p>
                        
                        <div className="flex gap-2">
                          <Button className="bg-orange-600 hover:bg-orange-700">
                            Pagar Ahora
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                          </Button>
                          <Button variant="ghost" size="sm">
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Paid Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Todas las Facturas
                </CardTitle>
                <CardDescription>
                  Historial completo de facturación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {billingData.invoices.map((invoice: any) => (
                    <div key={invoice.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(invoice.status)}
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {invoice.id}
                              {getStatusBadge(invoice.status)}
                            </h3>
                            <p className="text-sm text-muted-foreground">{invoice.treatment}</p>
                            <div className="text-sm text-muted-foreground mt-1">
                              {formatDate(invoice.date)} - {invoice.doctor_name}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {formatCurrency(invoice.amount)}
                          </p>
                          {invoice.status === "paid" && invoice.payment_date && (
                            <p className="text-xs text-green-600">
                              Pagado: {formatDate(invoice.payment_date)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                        <Button variant="ghost" size="sm">
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Historial de Pagos
                </CardTitle>
                <CardDescription>
                  Registro de todos tus pagos realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {billingData.payments.map((payment: any) => (
                    <div key={payment.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <div>
                            <h3 className="font-semibold">{payment.id}</h3>
                            <p className="text-sm text-muted-foreground">
                              Pago de factura: {payment.invoice_id}
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mt-2">
                              <div>
                                <span className="font-medium">Fecha: </span>
                                <span>{formatDate(payment.date)}</span>
                              </div>
                              <div>
                                <span className="font-medium">Método: </span>
                                <span>{payment.method}</span>
                              </div>
                              <div>
                                <span className="font-medium">Referencia: </span>
                                <span>{payment.reference}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(payment.amount)}
                          </p>
                          <Badge variant="default" className="bg-green-100 text-green-800 mt-1">
                            Procesado
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payment Methods Info */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pago Disponibles</CardTitle>
            <CardDescription>
              Formas de pago que aceptamos para tus tratamientos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 border rounded">
                <CreditCard className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="font-medium">Tarjetas</p>
                  <p className="text-xs text-muted-foreground">Visa, MasterCard</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 border rounded">
                <FileText className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium">Transferencia</p>
                  <p className="text-xs text-muted-foreground">Bancaria</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 border rounded">
                <DollarSign className="h-6 w-6 text-purple-500" />
                <div>
                  <p className="font-medium">Efectivo</p>
                  <p className="text-xs text-muted-foreground">En consultorio</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 border rounded">
                <Calendar className="h-6 w-6 text-orange-500" />
                <div>
                  <p className="font-medium">Planes</p>
                  <p className="text-xs text-muted-foreground">Financiamiento</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientPortalLayout>
  )
}