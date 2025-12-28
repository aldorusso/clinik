export function getInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase()
  }
  if (email) {
    return email.slice(0, 2).toUpperCase()
  }
  return "U"
}

export function getRoleLabel(role?: string): string {
  const labels: Record<string, string> = {
    superadmin: "Super Administrador",
    tenant_admin: "Administrador",
    manager: "Manager",
    user: "Usuario",
    client: "Cliente",
  }
  return labels[role || ""] || role || "Usuario"
}
