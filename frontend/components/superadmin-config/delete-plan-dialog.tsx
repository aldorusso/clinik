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
import { Plan } from "@/lib/api"

interface DeletePlanDialogProps {
  plan: Plan | null
  onClose: () => void
  onConfirm: () => void
}

export function DeletePlanDialog({ plan, onClose, onConfirm }: DeletePlanDialogProps) {
  return (
    <AlertDialog open={!!plan} onOpenChange={() => onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Plan</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estas seguro de eliminar el plan &quot;{plan?.name}&quot;? Esta
            accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
