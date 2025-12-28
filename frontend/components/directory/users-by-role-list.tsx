"use client"

import { Badge } from "@/components/ui/badge"
import { User as UserType } from "@/lib/api"
import { getRoleInfo, UsersByRole } from "./directory-helpers"
import { UserCard } from "./user-card"

interface UsersByRoleListProps {
  usersByRole: UsersByRole
}

export function UsersByRoleList({ usersByRole }: UsersByRoleListProps) {
  const roleKeys = Object.keys(usersByRole) as (keyof UsersByRole)[]

  return (
    <div className="space-y-6">
      {roleKeys.map((role) => {
        const roleUsers = usersByRole[role]
        if (roleUsers.length === 0) return null

        const roleInfo = getRoleInfo(role)
        const RoleIcon = roleInfo.icon

        return (
          <div key={role}>
            <div className="flex items-center gap-2 mb-4">
              <RoleIcon className={`h-5 w-5 ${roleInfo.color}`} />
              <h2 className="text-xl font-semibold">{roleInfo.label}s</h2>
              <Badge variant="outline">{roleUsers.length}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roleUsers.map((user: UserType) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
