"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Key, Save, Eye, EyeOff } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { auth } from "@/lib/auth"

export default function ApiKeysPage() {
  const router = useRouter()
  const [googleMapsKey, setGoogleMapsKey] = useState("")
  const [serpApiKey, setSerpApiKey] = useState("")
  const [showGoogleMapsKey, setShowGoogleMapsKey] = useState(false)
  const [showSerpApiKey, setShowSerpApiKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadApiKeys = async () => {
      const token = auth.getToken()
      if (!token) {
        router.push("/")
        return
      }

      try {
        // TODO: Load API keys from backend
        // const keys = await api.getApiKeys(token)
        // setGoogleMapsKey(keys.google_maps_key || "")
        // setSerpApiKey(keys.serp_api_key || "")
      } catch (error) {
        console.error("Error loading API keys:", error)
      }
    }

    loadApiKeys()
  }, [router])

  const handleSave = async () => {
    const token = auth.getToken()
    if (!token) {
      toast.error("Sesión expirada", {
        description: "Por favor inicia sesión nuevamente"
      })
      router.push("/")
      return
    }

    setIsSaving(true)

    try {
      // TODO: Save API keys to backend
      // await api.updateApiKeys(token, {
      //   google_maps_key: googleMapsKey,
      //   serp_api_key: serpApiKey
      // })

      toast.success("API Keys guardadas", {
        description: "Tus claves de API han sido actualizadas correctamente"
      })
    } catch (error) {
      toast.error("Error al guardar", {
        description: "No se pudieron guardar las API keys. Intenta de nuevo."
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-6 w-6" />
            <h1 className="text-3xl font-bold">API Keys</h1>
          </div>
          <p className="text-muted-foreground">
            Configura tus claves de API para los servicios externos
          </p>
        </div>

        <div className="grid gap-6">
          {/* Google Maps API Key */}
          <Card>
            <CardHeader>
              <CardTitle>Google Maps API</CardTitle>
              <CardDescription>
                Clave de API para acceder a los servicios de Google Maps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="google-maps-key">
                  API Key
                </Label>
                <div className="relative">
                  <Input
                    id="google-maps-key"
                    type={showGoogleMapsKey ? "text" : "password"}
                    placeholder="AIza..."
                    value={googleMapsKey}
                    onChange={(e) => setGoogleMapsKey(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGoogleMapsKey(!showGoogleMapsKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showGoogleMapsKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Obtén tu clave en{" "}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google Cloud Console
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SerpAPI Key */}
          <Card>
            <CardHeader>
              <CardTitle>SerpAPI</CardTitle>
              <CardDescription>
                Clave de API para acceder a los servicios de SerpAPI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serp-api-key">
                  API Key
                </Label>
                <div className="relative">
                  <Input
                    id="serp-api-key"
                    type={showSerpApiKey ? "text" : "password"}
                    placeholder="..."
                    value={serpApiKey}
                    onChange={(e) => setSerpApiKey(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSerpApiKey(!showSerpApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showSerpApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Obtén tu clave en{" "}
                  <a
                    href="https://serpapi.com/manage-api-key"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    SerpAPI Dashboard
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="lg"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Guardando..." : "Guardar API Keys"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
