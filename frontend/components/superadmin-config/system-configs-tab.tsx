"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings, Shield, CreditCard, Save } from "lucide-react"
import { SystemConfig } from "@/lib/api"

interface SystemConfigsTabProps {
  configsByCategory: Record<string, SystemConfig[]>
  configValues: Record<string, string>
  onConfigChange: (key: string, value: string) => void
  onSave: () => void
  hasChanges: boolean
  saving: boolean
}

const categoryLabels: Record<string, { label: string; icon: typeof Settings }> = {
  general: { label: "General", icon: Settings },
  security: { label: "Seguridad", icon: Shield },
  billing: { label: "Facturacion", icon: CreditCard },
}

export function SystemConfigsTab({
  configsByCategory,
  configValues,
  onConfigChange,
  onSave,
  hasChanges,
  saving
}: SystemConfigsTabProps) {
  return (
    <div className="space-y-4">
      {Object.entries(configsByCategory).map(([category, categoryConfigs]) => {
        const categoryInfo = categoryLabels[category] || {
          label: category,
          icon: Settings,
        }
        const Icon = categoryInfo.icon

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {categoryInfo.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryConfigs.map((config) => (
                <div key={config.id} className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={config.key}>{config.description || config.key}</Label>
                    {config.value_type === "boolean" ? (
                      <Switch
                        id={config.key}
                        checked={configValues[config.key] === "true"}
                        onCheckedChange={(checked) =>
                          onConfigChange(config.key, checked ? "true" : "false")
                        }
                      />
                    ) : (
                      <Input
                        id={config.key}
                        type={config.value_type === "number" ? "number" : "text"}
                        value={configValues[config.key] || ""}
                        onChange={(e) => onConfigChange(config.key, e.target.value)}
                        className="max-w-xs"
                      />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}

      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      )}
    </div>
  )
}
