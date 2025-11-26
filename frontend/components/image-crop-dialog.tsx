"use client"

import { useState, useCallback } from "react"
import Cropper, { Area } from "react-easy-crop"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut } from "lucide-react"

interface ImageCropDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onCropComplete: (croppedImage: string) => void
}

// Tamaño máximo para fotos de perfil (px)
const MAX_SIZE = 256
// Calidad de compresión (0.85 es óptimo para WebP)
const QUALITY = 0.85

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.src = url
  })

// Detectar soporte de WebP
const supportsWebP = (): boolean => {
  if (typeof document === "undefined") return false
  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL("image/webp").startsWith("data:image/webp")
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("No 2d context")
  }

  // Calcular tamaño final (máximo MAX_SIZE manteniendo aspecto 1:1)
  const size = Math.min(pixelCrop.width, pixelCrop.height, MAX_SIZE)
  canvas.width = size
  canvas.height = size

  // Habilitar suavizado para mejor calidad al redimensionar
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  )

  // Usar WebP si está soportado, sino JPEG
  const format = supportsWebP() ? "image/webp" : "image/jpeg"

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return
        }
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = () => {
          resolve(reader.result as string)
        }
      },
      format,
      QUALITY
    )
  })
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop)
  }, [])

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom)
  }, [])

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels) return

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
      onCropComplete(croppedImage)
      onOpenChange(false)
    } catch (e) {
      console.error(e)
    }
  }, [croppedAreaPixels, imageSrc, onCropComplete, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
          <DialogDescription>
            Arrastra para reposicionar y usa el deslizador para hacer zoom
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-96 w-full bg-muted">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
