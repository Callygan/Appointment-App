export interface Service {
  id: string
  name: string
  description?: string
  duration_minutes: number
  price?: number
  service_type: 'main' | 'extra'
  sort_order: number
}

export interface AvailableSlot {
  id: string
  date: string        // format: YYYY-MM-DD
  start_time: string  // format: HH:MM
  end_time: string    // format: HH:MM
  is_booked: boolean
  created_by?: string
}

export interface Appointment {
  id: string
  booking_number: number
  slot_id: string
  client_name: string
  client_phone: string
  client_instagram?: string
  service_id?: string
  created_at: string
  status: 'pending' | 'confirmed' | 'cancelled'
  appointment_date?: string
  appointment_time?: string
  // joined fields
  available_slots?: AvailableSlot
  services?: Pick<Service, 'name' | 'price'>
}
