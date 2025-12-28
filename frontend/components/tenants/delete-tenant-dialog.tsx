"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TenantWithStats } from "@/lib/api"

interface DeleteTenantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: TenantWithStats | null
  onConfirm: () => void
}

export function DeleteTenantDialog({
  open,
  onOpenChange,
  tenant,
  onConfirm,
}: DeleteTenantDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Organizacion</AlertDialogTitle>
          <AlertDialogDescription>
            Estas seguro de que deseas eliminar la organizacion{" "}
            <strong>{tenant?.name}</strong>? Esta accion eliminara todos los
            usuarios y datos asociados. Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
