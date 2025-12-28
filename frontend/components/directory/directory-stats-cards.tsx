"use client"

import { Card, CardContent } from "@/components/ui/card"
import { getRoleInfo, UsersByRole } from "./directory-helpers"

interface DirectoryStatsCardsProps {
  usersByRole: UsersByRole
}

export function DirectoryStatsCards({ usersByRole }: DirectoryStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      {Object.entries(usersByRole).map(([role, roleUsers]) => {
        if (role === 'others' || roleUsers.length === 0) return null
        const roleInfo = getRoleInfo(role)
        const RoleIcon = roleInfo.icon
        return (
          <Card key={role}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <RoleIcon className={`h-5 w-5 ${roleInfo.color}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{roleInfo.label}s</p>
                  <p className="text-2xl font-bold">{roleUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
