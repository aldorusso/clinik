"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Package, AlertTriangle, Plus, Minus } from "lucide-react"
import { auth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { 
  getInventoryProducts,
  recordInventoryUsage, 
  type InventoryProductWithStats,
  UNIT_TYPES
} from "@/lib/api-inventory"

interface InventoryUsageDialogProps {
  isOpen: boolean
  onClose: () => void
  appointmentId: string
  serviceId?: string
  onUsageRecorded: () => void
}

interface InventoryUsageItem {
  productId: string
  productName: string
  quantity: number
  unitType: string
  currentStock: number
  notes?: string
}

export function InventoryUsageDialog({
  isOpen,
  onClose,
  appointmentId,
  serviceId,
  onUsageRecorded,
}: InventoryUsageDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<InventoryProductWithStats[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [usageItems, setUsageItems] = useState<InventoryUsageItem[]>([])
  
  // Load available products
  useEffect(() => {
    const loadProducts = async () => {
      if (!isOpen) return
      
      const token = auth.getToken()
      if (!token) return

      try {
        // Load all active products with stock
        const productsData = await getInventoryProducts(token, { 
          is_active: true 
        })
        
        // Filter products that have stock
        const availableProducts = productsData.filter(p => p.current_stock > 0)
        setProducts(availableProducts)
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos disponibles",
          variant: "destructive",
        })
      }
    }

    loadProducts()
  }, [isOpen, toast])

  // Add product to usage list
  const addProduct = () => {
    if (!selectedProduct) return

    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    // Check if product already in list
    if (usageItems.find(item => item.productId === selectedProduct)) {
      toast({
        title: "Producto ya agregado",
        description: "Este producto ya está en la lista de uso",
        variant: "destructive",
      })
      return
    }

    setUsageItems([...usageItems, {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitType: product.unit_type,
      currentStock: product.current_stock,
      notes: ""
    }])

    setSelectedProduct("")
  }

  // Update quantity for a product
  const updateQuantity = (productId: string, newQuantity: number) => {
    setUsageItems(items => 
      items.map(item => {
        if (item.productId === productId) {
          // Validate quantity
          if (newQuantity <= 0) {
            return item
          }
          if (newQuantity > item.currentStock) {
            toast({
              title: "Stock insuficiente",
              description: `Solo hay ${item.currentStock} ${item.unitType} disponibles`,
              variant: "destructive",
            })
            return item
          }
          return { ...item, quantity: newQuantity }
        }
        return item
      })
    )
  }

  // Update notes for a product
  const updateNotes = (productId: string, notes: string) => {
    setUsageItems(items =>
      items.map(item =>
        item.productId === productId ? { ...item, notes } : item
      )
    )
  }

  // Remove product from list
  const removeProduct = (productId: string) => {
    setUsageItems(items => items.filter(item => item.productId !== productId))
  }

  // Submit usage
  const handleSubmit = async () => {
    if (usageItems.length === 0) {
      toast({
        title: "Sin productos",
        description: "Agrega al menos un producto para registrar su uso",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const token = auth.getToken()
    if (!token) {
      setLoading(false)
      return
    }

    try {
      // Record each item usage
      const promises = usageItems.map(item => 
        recordInventoryUsage(token, appointmentId, {
          product_id: item.productId,
          quantity_used: item.quantity,
          notes: item.notes
        })
      )

      await Promise.all(promises)

      toast({
        title: "Uso registrado",
        description: `Se registró el uso de ${usageItems.length} producto${usageItems.length > 1 ? 's' : ''}`,
      })

      onUsageRecorded()
      onClose()
      setUsageItems([])
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el uso de inventario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getUnitLabel = (unitType: string) => {
    return UNIT_TYPES.find(type => type.value === unitType)?.label || unitType
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>💊 Usar Inventario en Cita</DialogTitle>
          <DialogDescription>
            Registra los productos médicos utilizados durante esta cita
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Product Section */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium">Agregar Producto</h3>
            <div className="flex gap-2">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar producto del inventario" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{product.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {product.current_stock} {getUnitLabel(product.unit_type)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addProduct} disabled={!selectedProduct}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Usage List */}
          <div className="space-y-4">
            {usageItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>No se han agregado productos aún</p>
              </div>
            ) : (
              usageItems.map((item) => (
                <div key={item.productId} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{item.productName}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(item.productId)}
                      className="text-destructive"
                    >
                      Eliminar
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cantidad a usar</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                          className="text-center w-20"
                          min="1"
                          max={item.currentStock}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.currentStock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {getUnitLabel(item.unitType)}
                        </span>
                      </div>
                      {item.quantity > item.currentStock * 0.5 && (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <AlertTriangle className="h-3 w-3" />
                          Usando más del 50% del stock disponible
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Stock Disponible</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.currentStock <= 10 ? "destructive" : "secondary"}>
                          {item.currentStock} {getUnitLabel(item.unitType)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Quedará: {item.currentStock - item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`notes-${item.productId}`}>Notas (opcional)</Label>
                    <Textarea
                      id={`notes-${item.productId}`}
                      value={item.notes}
                      onChange={(e) => updateNotes(item.productId, e.target.value)}
                      placeholder="Ej: Usado para limpieza de herida lateral"
                      rows={2}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          {usageItems.length > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Resumen de Uso</h4>
              <div className="space-y-1 text-sm">
                {usageItems.map((item) => (
                  <div key={item.productId} className="flex justify-between">
                    <span>{item.productName}</span>
                    <span className="font-medium">
                      {item.quantity} {getUnitLabel(item.unitType)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || usageItems.length === 0}>
            {loading ? "Registrando..." : "Registrar Uso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}