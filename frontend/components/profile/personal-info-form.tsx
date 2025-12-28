"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Save, Loader2, Building2, MapPin } from "lucide-react"

interface PersonalInfoFormProps {
  firstName: string
  setFirstName: (value: string) => void
  lastName: string
  setLastName: (value: string) => void
  email?: string
  phone: string
  setPhone: (value: string) => void
  country: string
  setCountry: (value: string) => void
  city: string
  setCity: (value: string) => void
  officeAddress: string
  setOfficeAddress: (value: string) => void
  companyName: string
  setCompanyName: (value: string) => void
  saving: boolean
  onSave: () => void
}

export function PersonalInfoForm({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  phone,
  setPhone,
  country,
  setCountry,
  city,
  setCity,
  officeAddress,
  setOfficeAddress,
  companyName,
  setCompanyName,
  saving,
  onSave,
}: PersonalInfoFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacion Personal</CardTitle>
        <CardDescription>Actualiza tu informacion de contacto</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombre</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Apellido</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Tu apellido"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email || ""} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefono</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+34 600 000 000"
          />
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="country">Pais</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un pais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Espana">Espana</SelectItem>
                <SelectItem value="Mexico">Mexico</SelectItem>
                <SelectItem value="Argentina">Argentina</SelectItem>
                <SelectItem value="Colombia">Colombia</SelectItem>
                <SelectItem value="Chile">Chile</SelectItem>
                <SelectItem value="Peru">Peru</SelectItem>
                <SelectItem value="Estados Unidos">Estados Unidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="city"
                className="pl-10"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Madrid"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="officeAddress">Direccion de Oficina</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="officeAddress"
              className="pl-10"
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
              placeholder="Calle Principal 123"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName">Empresa</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="companyName"
              className="pl-10"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Mi Empresa S.L."
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
