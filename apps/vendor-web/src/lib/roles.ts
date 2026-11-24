export const STAFF_ROLES = [
  { value: 'owner', label: 'Owner', hint: 'Sees everything, including money.' },
  { value: 'manager', label: 'Manager', hint: 'Runs the day: services, team, and every booking.' },
  { value: 'practitioner', label: 'Takes appointments', hint: 'Only their own appointments and clients.' },
  { value: 'front_desk', label: 'Front desk', hint: 'Books people in and answers messages. Not the money.' },
] as const

export const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  STAFF_ROLES.map((role) => [role.value, role.label]),
)
