"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Archive } from "lucide-react"
import { InventoryCategory } from "@/lib/api-inventory"

interface CategoryStatsCardsProps {
  categories: InventoryCategory[]
  totalProducts: number
}

export function CategoryStatsCards({ categories, totalProducts }: CategoryStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Categorias</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Activas: {categories.filter(c => c.is_active).length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-gray-100 text-gray-800 border-gray-200">
              Inactivas: {categories.filter(c => !c.is_active).length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Productos</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
