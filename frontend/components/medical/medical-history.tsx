"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"
import { auth } from "@/lib/auth"
import { FileText, Plus } from "lucide-react"
import { AddHistoryForm } from "./add-history-form"
import { HistoryEntryCard } from "./history-entry-card"
import { EmptyHistory } from "./empty-history"

interface MedicalHistoryProps {
  patientId: string
  patientName: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL

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

  const getAuthHeaders = () => {
    const token = auth.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const loadMedicalHistory = async () => {
    const token = auth.getToken()
    if (!token) return

    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/v1/medical/patients/${patientId}/history`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) throw new Error("Failed to load medical history")

      const data = await response.json()
      setHistories(data.items)
    } catch (error) {
      console.error("Error loading medical history:", error)
      toast({ title: "Error", description: "No se pudo cargar el historial médico", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const addMedicalHistory = async () => {
    if (!newHistoryContent.trim()) return

    try {
      const response = await fetch(`${API_URL}/api/v1/medical/patients/${patientId}/history`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId, content: newHistoryContent }),
      })

      if (!response.ok) throw new Error("Failed to add medical history")

      toast({ title: "Éxito", description: "Historia médica agregada correctamente" })
      setNewHistoryContent("")
      setIsAddingHistory(false)
      loadMedicalHistory()
    } catch (error) {
      console.error("Error adding medical history:", error)
      toast({ title: "Error", description: "No se pudo agregar la historia médica", variant: "destructive" })
    }
  }

  const updateMedicalHistory = async (historyId: string) => {
    if (!editContent.trim()) return

    try {
      const response = await fetch(`${API_URL}/api/v1/medical/history/${historyId}`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      })

      if (!response.ok) throw new Error("Failed to update medical history")

      toast({ title: "Éxito", description: "Historia médica actualizada correctamente" })
      setEditingHistory(null)
      setEditContent("")
      loadMedicalHistory()
    } catch (error) {
      console.error("Error updating medical history:", error)
      toast({ title: "Error", description: "No se pudo actualizar la historia médica", variant: "destructive" })
    }
  }

  const uploadAttachment = async (historyId: string, file: File) => {
    try {
      setUploadingFile(historyId)
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${API_URL}/api/v1/medical/history/${historyId}/attachments`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to upload attachment")

      toast({ title: "Éxito", description: "Archivo adjunto subido correctamente" })
      loadMedicalHistory()
    } catch (error) {
      console.error("Error uploading attachment:", error)
      toast({ title: "Error", description: "No se pudo subir el archivo adjunto", variant: "destructive" })
    } finally {
      setUploadingFile(null)
    }
  }

  const deleteAttachment = async (attachmentId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/medical/attachments/${attachmentId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (!response.ok) throw new Error("Failed to delete attachment")

      toast({ title: "Éxito", description: "Archivo adjunto eliminado correctamente" })
      loadMedicalHistory()
    } catch (error) {
      console.error("Error deleting attachment:", error)
      toast({ title: "Error", description: "No se pudo eliminar el archivo adjunto", variant: "destructive" })
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
        {isAddingHistory && (
          <AddHistoryForm
            content={newHistoryContent}
            onChange={setNewHistoryContent}
            onSave={addMedicalHistory}
            onCancel={() => {
              setIsAddingHistory(false)
              setNewHistoryContent("")
            }}
          />
        )}

        <div className="space-y-4">
          {histories.length === 0 ? (
            <EmptyHistory />
          ) : (
            histories.map((history) => (
              <HistoryEntryCard
                key={history.id}
                history={history}
                isEditing={editingHistory === history.id}
                editContent={editContent}
                uploadingFile={uploadingFile === history.id}
                onEdit={() => {
                  setEditingHistory(history.id)
                  setEditContent(history.content)
                }}
                onCancelEdit={() => {
                  setEditingHistory(null)
                  setEditContent("")
                }}
                onSaveEdit={() => updateMedicalHistory(history.id)}
                onEditContentChange={setEditContent}
                onUploadFile={(file) => uploadAttachment(history.id, file)}
                onDeleteAttachment={deleteAttachment}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
