"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Edit } from "lucide-react"
import { InventoryCategory } from "@/lib/api-inventory"
import { getIconEmoji } from "./category-presets"

interface CategoryCardProps {
  category: InventoryCategory
  productCount: number
  onEdit: (category: InventoryCategory) => void
}

export function CategoryCard({ category, productCount, onEdit }: CategoryCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: category.color ? category.color + "20" : "#f1f5f9",
                color: category.color || "#64748b"
              }}
            >
              {category.icon ? (
                <span className="text-xl">{getIconEmoji(category.icon)}</span>
              ) : (
                <Package className="h-6 w-6" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <div className="flex gap-2 mt-1">
                <Badge variant={category.is_active ? "default" : "secondary"}>
                  {category.is_active ? "Activa" : "Inactiva"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {productCount} productos
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      {category.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {category.description}
          </p>
        </CardContent>
      )}
    </Card>
  )
}
