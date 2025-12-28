"use client"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Eye, Download } from "lucide-react"
import { Document } from "./document-types"
import { getStatusBadge, getCategoryBadge } from "./document-badges"
import { formatDate, handleViewDocument, handleDownloadDocument } from "./document-helpers"

interface DocumentsTableProps {
  documents: Document[]
  showStatus?: boolean
  showActions?: "all" | "pending" | "completed"
}

export function DocumentsTable({ documents, showStatus = true, showActions = "all" }: DocumentsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Documento</TableHead>
          <TableHead>Categoría</TableHead>
          {showStatus && <TableHead>Estado</TableHead>}
          <TableHead>Fecha</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell>
              <div>
                <div className="font-medium">{doc.title}</div>
                <div className="text-sm text-muted-foreground">
                  {doc.description}
                </div>
              </div>
            </TableCell>
            <TableCell>
              {getCategoryBadge(doc.category)}
            </TableCell>
            {showStatus && (
              <TableCell>
                {getStatusBadge(doc.status)}
              </TableCell>
            )}
            <TableCell>{formatDate(doc.date)}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                {showActions === "pending" ? (
                  <Button
                    size="sm"
                    onClick={() => handleViewDocument(doc)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {doc.category === 'consent' ? 'Revisar y Firmar' : 'Revisar'}
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDocument(doc)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadDocument(doc)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
