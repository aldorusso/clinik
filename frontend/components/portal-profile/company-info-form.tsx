"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2 } from "lucide-react"

interface CompanyInfoFormProps {
  companyName: string
  setCompanyName: (value: string) => void
  taxId: string
  setTaxId: (value: string) => void
}

export function CompanyInfoForm({
  companyName,
  setCompanyName,
  taxId,
  setTaxId
}: CompanyInfoFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacion de Empresa</CardTitle>
        <CardDescription>
          Datos de tu empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nombre de Empresa</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="companyName"
                className="pl-10"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Mi Empresa S.A."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxId">RUC / NIT / CIF</Label>
            <Input
              id="taxId"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="12345678901"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
