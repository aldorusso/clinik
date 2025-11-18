"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { auth } from "@/lib/auth"
import { EmailTemplatePreview, EmailTemplateType } from "@/types/email-template"
import { Mail, AlertCircle } from "lucide-react"

export default function PreviewEmailTemplatePage() {
  const params = useParams()
  const templateType = params.type as EmailTemplateType

  const [preview, setPreview] = useState<EmailTemplatePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadPreview()
  }, [templateType])

  const loadPreview = async () => {
    try {
      setLoading(true)
      const token = auth.getToken()

      if (!token) {
        setError("No hay sesión activa")
        return
      }

      const data = await api.previewEmailTemplate(token, templateType)
      setPreview(data)
    } catch (err) {
      setError("Error al cargar la vista previa")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando vista previa...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-center mb-2">Error</h2>
          <p className="text-gray-600 text-center">{error}</p>
        </div>
      </div>
    )
  }

  if (!preview) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
          {/* Email Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold">Vista Previa del Email</h1>
            </div>

            <div className="space-y-2">
              <div className="flex items-start">
                <span className="font-semibold text-gray-700 w-20">
                  Asunto:
                </span>
                <span className="text-gray-900">{preview.subject}</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold text-gray-700 w-20">De:</span>
                <span className="text-gray-600">
                  Scraper API &lt;noreply@example.com&gt;
                </span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold text-gray-700 w-20">Para:</span>
                <span className="text-gray-600">usuario@example.com</span>
              </div>
            </div>
          </div>

          {/* Email Body */}
          <div className="p-6 bg-gray-50">
            <div className="bg-white rounded border border-gray-200">
              <iframe
                srcDoc={preview.html_content}
                className="w-full min-h-[600px] border-0"
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          {/* Sample Data Info */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3">
              Datos de Ejemplo Utilizados:
            </h3>
            <div className="bg-white p-4 rounded border border-gray-200">
              <pre className="text-xs text-gray-600 overflow-x-auto">
                {JSON.stringify(preview.sample_data, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => window.close()}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Cerrar Vista Previa
          </button>
        </div>
      </div>
    </div>
  )
}
