"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Filter } from "lucide-react"
import { ACTION_LABELS, CATEGORY_LABELS } from "./audit-constants"

interface AuditFiltersProps {
  actions: string[]
  categories: string[]
  filterAction: string
  setFilterAction: (value: string) => void
  filterCategory: string
  setFilterCategory: (value: string) => void
  searchQuery: string
  setSearchQuery: (value: string) => void
  startDate: string
  setStartDate: (value: string) => void
  endDate: string
  setEndDate: (value: string) => void
  onSearch: () => void
  onClearFilters: () => void
}

export function AuditFilters({
  actions,
  categories,
  filterAction,
  setFilterAction,
  filterCategory,
  setFilterCategory,
  searchQuery,
  setSearchQuery,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onSearch,
  onClearFilters
}: AuditFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label>Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Email, IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Accion</Label>
            <Select
              value={filterAction || "all"}
              onValueChange={(val) => setFilterAction(val === "all" ? "" : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {ACTION_LABELS[action]?.label || action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={filterCategory || "all"}
              onValueChange={(val) => setFilterCategory(val === "all" ? "" : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]?.label || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Desde</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Hasta</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={onSearch}>
            <Search className="mr-2 h-4 w-4" />
            Buscar
          </Button>
          <Button variant="outline" onClick={onClearFilters}>
            Limpiar filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
