"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Trash2, Check, Users, HardDrive } from "lucide-react"
import { Plan } from "@/lib/api"

interface PlansTableProps {
  plans: Plan[]
  onCreatePlan: () => void
  onEditPlan: (plan: Plan) => void
  onDeletePlan: (plan: Plan) => void
  onSetDefault: (plan: Plan) => void
}

export function PlansTable({
  plans,
  onCreatePlan,
  onEditPlan,
  onDeletePlan,
  onSetDefault
}: PlansTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Planes de Suscripcion</CardTitle>
          <CardDescription>
            Gestiona los planes disponibles para los tenants
          </CardDescription>
        </div>
        <Button onClick={onCreatePlan}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Plan
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Precio Mensual</TableHead>
              <TableHead>Precio Anual</TableHead>
              <TableHead>Limites</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {plan.name}
                      {plan.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {plan.slug}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {plan.price_monthly === 0 ? (
                    <span className="text-green-600 font-medium">Gratis</span>
                  ) : (
                    <span>
                      ${Number(plan.price_monthly).toFixed(2)}/{plan.currency}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {plan.price_yearly === 0 ? (
                    <span className="text-green-600 font-medium">Gratis</span>
                  ) : (
                    <span>
                      ${Number(plan.price_yearly).toFixed(2)}/{plan.currency}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {plan.max_users === -1 ? "∞" : plan.max_users}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {plan.max_storage_gb}GB
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {plan.is_active ? (
                    <Badge className="bg-green-500">Activo</Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {!plan.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSetDefault(plan)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditPlan(plan)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!plan.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeletePlan(plan)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
