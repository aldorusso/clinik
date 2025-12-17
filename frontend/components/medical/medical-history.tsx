"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { Spinner } from "@/components/ui/spinner"
import { auth } from "@/lib/auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  FileText,
  Plus,
  Upload,
  Calendar,
  User,
  Paperclip,
  Image,
  FileIcon,
  Trash2,
  Edit,
  Save,
  X
} from "lucide-react"

interface MedicalHistoryProps {
  patientId: string
  patientName: string
}

export function MedicalHistory({ patientId, patientName }: MedicalHistoryProps) {
  const [histories, setHistories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingHistory, setIsAddingHistory] = useState(false)
  const [newHistoryContent, setNewHistoryContent] = useState("")
  const [editingHistory, setEditingHistory] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [uploadingFile, setUploadingFile] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadMedicalHistory()
  }, [patientId])

  const loadMedicalHistory = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/medical/patients/${patientId}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to load medical history")

      const data = await response.json()
      setHistories(data.items)
    } catch (error) {
      console.error("Error loading medical history:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el historial médico",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addMedicalHistory = async () => {
    if (!newHistoryContent.trim()) return

    const token = auth.getToken()
    if (!token) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/medical/patients/${patientId}/history`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: patientId,
          content: newHistoryContent,
        }),
      })

      if (!response.ok) throw new Error("Failed to add medical history")

      toast({
        title: "Éxito",
        description: "Historia médica agregada correctamente",
      })

      setNewHistoryContent("")
      setIsAddingHistory(false)
      loadMedicalHistory()
    } catch (error) {
      console.error("Error adding medical history:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar la historia médica",
        variant: "destructive",
      })
    }
  }

  const updateMedicalHistory = async (historyId: string) => {
    if (!editContent.trim()) return

    const token = auth.getToken()
    if (!token) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/medical/history/${historyId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: editContent,
        }),
      })

      if (!response.ok) throw new Error("Failed to update medical history")

      toast({
        title: "Éxito",
        description: "Historia médica actualizada correctamente",
      })

      setEditingHistory(null)
      setEditContent("")
      loadMedicalHistory()
    } catch (error) {
      console.error("Error updating medical history:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la historia médica",
        variant: "destructive",
      })
    }
  }

  const uploadAttachment = async (historyId: string, file: File) => {
    const token = auth.getToken()
    if (!token) return

    try {
      setUploadingFile(historyId)
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/medical/history/${historyId}/attachments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to upload attachment")

      toast({
        title: "Éxito",
        description: "Archivo adjunto subido correctamente",
      })

      loadMedicalHistory()
    } catch (error) {
      console.error("Error uploading attachment:", error)
      toast({
        title: "Error",
        description: "No se pudo subir el archivo adjunto",
        variant: "destructive",
      })
    } finally {
      setUploadingFile(null)
    }
  }

  const deleteAttachment = async (attachmentId: string) => {
    const token = auth.getToken()
    if (!token) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/medical/attachments/${attachmentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to delete attachment")

      toast({
        title: "Éxito",
        description: "Archivo adjunto eliminado correctamente",
      })

      loadMedicalHistory()
    } catch (error) {
      console.error("Error deleting attachment:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el archivo adjunto",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Historia Médica
            </CardTitle>
            <CardDescription>
              Historial completo del paciente {patientName}
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddingHistory(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Agregar Entrada
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add New History Entry */}
        {isAddingHistory && (
          <Card className="mb-4 border-blue-200 bg-blue-50/50">
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-history">Nueva entrada en historia médica</Label>
                  <Textarea
                    id="new-history"
                    placeholder="Escriba aquí las notas médicas, observaciones, diagnósticos, tratamientos..."
                    value={newHistoryContent}
                    onChange={(e) => setNewHistoryContent(e.target.value)}
                    rows={6}
                    className="mt-2"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingHistory(false)
                      setNewHistoryContent("")
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={addMedicalHistory}
                    disabled={!newHistoryContent.trim()}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Guardar Entrada
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medical History Entries */}
        <div className="space-y-4">
          {histories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <p>No hay entradas en el historial médico</p>
              <p className="text-sm">Comience agregando la primera entrada</p>
            </div>
          ) : (
            histories.map((history) => (
              <Card key={history.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {new Date(history.created_at).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {history.updated_at !== history.created_at && (
                            <span className="text-xs text-muted-foreground ml-6">
                              (Editado: {new Date(history.updated_at).toLocaleDateString("es-ES")})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingHistory(history.id)
                            setEditContent(history.content)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    {editingHistory === history.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={6}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingHistory(null)
                              setEditContent("")
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateMedicalHistory(history.id)}
                          >
                            Guardar Cambios
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm">{history.content}</div>
                    )}

                    {/* Attachments */}
                    {history.attachments && history.attachments.length > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Paperclip className="h-4 w-4" />
                          Archivos adjuntos
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {history.attachments.map((attachment: any) => (
                            <div
                              key={attachment.id}
                              className="flex items-center gap-2 p-2 border rounded-md hover:bg-muted/50"
                            >
                              {attachment.file_type === "image" ? (
                                <Image className="h-4 w-4 text-blue-600" />
                              ) : (
                                <FileIcon className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-xs truncate flex-1">
                                {attachment.filename}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteAttachment(attachment.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload Attachment */}
                    <div className="pt-2">
                      <Label
                        htmlFor={`upload-${history.id}`}
                        className="cursor-pointer inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Upload className="h-4 w-4" />
                        Adjuntar archivo (PDF, imagen)
                      </Label>
                      <Input
                        id={`upload-${history.id}`}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            uploadAttachment(history.id, file)
                          }
                        }}
                        disabled={uploadingFile === history.id}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}