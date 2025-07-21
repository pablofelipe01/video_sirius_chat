'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar, Users, Zap } from 'lucide-react'
import { Employee } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@supabase/supabase-js'

interface CreateMeetingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (meeting?: unknown) => void
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CreateMeetingModal({ isOpen, onClose, onSuccess }: CreateMeetingModalProps) {
  const { employee } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [duration, setDuration] = useState(60)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Cargar empleados
  useEffect(() => {
    if (isOpen) {
      loadEmployees()
    }
  }, [isOpen])

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .order('first_name')

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!employee || !title || !scheduledDate || !scheduledTime) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    setIsLoading(true)

    try {
      // Combinar fecha y hora
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`)
      
      // Generar IDs únicos
      const meetingId = crypto.randomUUID() // UUID real para PostgreSQL
      const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Crear la reunión
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          id: meetingId,
          title,
          description,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: duration,
          status: 'scheduled',
          host_cedula: employee.cedula,
          room_id: roomId,
          meeting_id: `meeting-${Date.now()}`
        })
        .select()
        .single()

      if (meetingError) throw meetingError

      // Agregar participantes (incluyendo al creador)
      const participantsToAdd = [...selectedParticipants, employee.cedula]
      const participantRecords = participantsToAdd.map(cedula => ({
        meeting_id: meetingId,
        participant_cedula: cedula,
        participant_type: 'internal'
      }))

      const { error: participantsError } = await supabase
        .from('meeting_participants')
        .insert(participantRecords)

      if (participantsError) throw participantsError

      // Resetear formulario
      setTitle('')
      setDescription('')
      setScheduledDate('')
      setScheduledTime('')
      setDuration(60)
      setSelectedParticipants([])
      
      onSuccess(meeting)
      onClose()
      
      alert('Reunión creada exitosamente')
    } catch (error) {
      console.error('Error creating meeting:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      alert(`Error al crear la reunión: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleParticipant = (cedula: string) => {
    setSelectedParticipants(prev => 
      prev.includes(cedula) 
        ? prev.filter(p => p !== cedula)
        : [...prev, cedula]
    )
  }

  const handleQuickMeeting = () => {
    const now = new Date()
    const today = now.toISOString().split('T')[0] // YYYY-MM-DD
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM
    
    setTitle('Reunión Rápida')
    setDescription('Reunión iniciada inmediatamente')
    setScheduledDate(today)
    setScheduledTime(currentTime)
    setDuration(30) // 30 minutos por defecto para reuniones rápidas
    setSelectedParticipants([]) // Sin participantes por defecto
  }

  const filteredEmployees = employees.filter(emp => 
    emp.cedula !== employee?.cedula && // Excluir al creador
    (emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     emp.department.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Programar Nueva Reunión
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              onClick={handleQuickMeeting}
              className="flex items-center gap-2 text-sm"
            >
              <Zap className="w-4 h-4" />
              Reunión Rápida
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-slate-700 font-medium">Título de la Reunión *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Reunión de Pirólisis Semanal"
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-slate-700 font-medium">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción opcional de la reunión"
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                rows={3}
              />
            </div>
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date" className="text-slate-700 font-medium">Fecha *</Label>
              <Input
                id="date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="time" className="text-slate-700 font-medium">Hora *</Label>
              <Input
                id="time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="duration" className="text-slate-700 font-medium">Duración (min)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={15}
                max={240}
                step={15}
                className="bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Participantes */}
          <div>
            <Label className="flex items-center gap-2 mb-3 text-slate-700 font-medium">
              <Users className="w-4 h-4" />
              Invitar Participantes
            </Label>
            
            <Input
              placeholder="Buscar empleados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-3 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
            />

            <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.cedula}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    selectedParticipants.includes(emp.cedula)
                      ? 'bg-emerald-500/20 border border-emerald-400/50'
                      : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                  }`}
                  onClick={() => toggleParticipant(emp.cedula)}
                >
                  <div>
                    <p className="font-medium text-slate-900">{emp.first_name} {emp.last_name}</p>
                    <p className="text-sm text-slate-600">{emp.department}</p>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedParticipants.includes(emp.cedula)
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-400 bg-white'
                  }`}>
                    {selectedParticipants.includes(emp.cedula) && '✓'}
                  </div>
                </div>
              ))}
            </div>

            {selectedParticipants.length > 0 && (
              <p className="text-sm text-slate-700 mt-2 font-medium">
                {selectedParticipants.length} participante(s) seleccionado(s)
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Creando...' : 'Crear Reunión'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
