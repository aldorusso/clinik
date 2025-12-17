"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface ActivityItem {
  id: string
  user: {
    name: string
    avatar?: string
    initials?: string
  }
  action: string
  target?: string
  timestamp: Date | string
  type?: "lead" | "appointment" | "sale" | "call" | "email" | "general"
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  title?: string
  showViewAll?: boolean
  onViewAll?: () => void
  className?: string
  maxItems?: number
}

const getTypeColor = (type?: string) => {
  switch (type) {
    case "lead":
      return "bg-blue-500"
    case "appointment":
      return "bg-purple-500"
    case "sale":
      return "bg-emerald"
    case "call":
      return "bg-amber-500"
    case "email":
      return "bg-cyan-500"
    default:
      return "bg-gray-400"
  }
}

export function ActivityFeed({
  activities,
  title = "Actividad Reciente",
  showViewAll = true,
  onViewAll,
  className,
  maxItems = 5
}: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems)

  const formatTime = (timestamp: Date | string) => {
    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp
    return formatDistanceToNow(date, { addSuffix: true, locale: es })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={cn(
      "bg-card rounded-2xl border border-border/50 shadow-sm",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {showViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Ver todo
          </button>
        )}
      </div>

      {/* Activity List */}
      <div className="divide-y divide-border/50">
        {displayedActivities.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
          </div>
        ) : (
          displayedActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 px-6 py-4 hover:bg-muted/30 transition-colors"
            >
              {/* Avatar with type indicator */}
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                    {activity.user.initials || getInitials(activity.user.name)}
                  </AvatarFallback>
                </Avatar>
                {activity.type && (
                  <span className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                    getTypeColor(activity.type)
                  )} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{activity.user.name}</span>
                  {" "}
                  <span className="text-muted-foreground">{activity.action}</span>
                  {activity.target && (
                    <>
                      {" "}
                      <span className="font-medium text-primary">{activity.target}</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
