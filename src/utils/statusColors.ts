export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled'

export const STATUS_COLOR: Record<AppointmentStatus, {
  bg: string; text: string; dot: string; color: string; border: string
}> = {
  confirmed: { bg: 'bg-[#34c759]/15', text: 'text-[#1a6b33]', dot: 'bg-[#34c759]', color: 'text-[#34c759]', border: 'border-[#34c759]/30' },
  pending:   { bg: 'bg-[#f59e0b]/15', text: 'text-[#92400e]', dot: 'bg-[#f59e0b]', color: 'text-[#f59e0b]', border: 'border-[#f59e0b]/30' },
  cancelled: { bg: 'bg-red-100/60',   text: 'text-red-600',   dot: 'bg-red-400',    color: 'text-red-500',   border: 'border-red-200/50'   },
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: 'Confirmată',
  pending:   'În așteptare',
  cancelled: 'Anulată',
}
