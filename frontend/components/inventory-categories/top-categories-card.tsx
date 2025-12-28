"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"
import { InventoryCategory } from "@/lib/api-inventory"
import { getIconEmoji } from "./category-presets"

interface TopCategoriesCardProps {
  categories: InventoryCategory[]
  categoryProducts: Record<string, number>
}

export function TopCategoriesCard({ categories, categoryProducts }: TopCategoriesCardProps) {
  const activeWithProducts = categories
    .filter(cat => cat.is_active && (categoryProducts[cat.id] || 0) > 0)
    .sort((a, b) => (categoryProducts[b.id] || 0) - (categoryProducts[a.id] || 0))
    .slice(0, 5)

  if (activeWithProducts.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          Categorias Mas Utilizadas
        </CardTitle>
        <CardDescription>
          Categorias con mayor numero de productos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeWithProducts.map((category, index) => {
            const productCount = categoryProducts[category.id] || 0

            return (
              <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: category.color ? category.color + "20" : "#f1f5f9",
                      color: category.color || "#64748b"
                    }}
                  >
                    {category.icon ? (
                      <span className="text-sm">{getIconEmoji(category.icon)}</span>
                    ) : (
                      <Package className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    {category.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
                <Badge>
                  {productCount} producto{productCount !== 1 ? 's' : ''}
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
