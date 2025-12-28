"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Calendar,
  Paperclip,
  Image,
  FileIcon,
  Trash2,
  Edit,
  Upload,
} from "lucide-react"

interface HistoryEntry {
  id: string
  content: string
  created_at: string
  updated_at: string
  attachments?: Attachment[]
}

interface Attachment {
  id: string
  filename: string
  file_type: string
}

interface HistoryEntryCardProps {
  history: HistoryEntry
  isEditing: boolean
  editContent: string
  uploadingFile: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onEditContentChange: (content: string) => void
  onUploadFile: (file: File) => void
  onDeleteAttachment: (attachmentId: string) => void
}

export function HistoryEntryCard({
  history,
  isEditing,
  editContent,
  uploadingFile,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onEditContentChange,
  onUploadFile,
  onDeleteAttachment,
}: HistoryEntryCardProps) {
  return (
    <Card className="border-l-4 border-l-blue-500">
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
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => onEditContentChange(e.target.value)}
                rows={6}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onCancelEdit}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={onSaveEdit}>
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
                {history.attachments.map((attachment) => (
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
                      onClick={() => onDeleteAttachment(attachment.id)}
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
                  onUploadFile(file)
                }
              }}
              disabled={uploadingFile}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
