'use client'

import { useState, useEffect } from 'react'
import HotelBookingForm from './HotelBookingForm'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Hotel, Building2, Plane, Package } from 'lucide-react'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: BookingData) => void
  type: 'hotel' | 'aula' | 'visa' | 'rental'
  selectedDate?: Date
  roomId?: string
}

interface BookingData {
  customerName: string
  customerWA: string
  type: string
  startDate: string
  endDate?: string
  roomId?: string
  itemId?: string
  notes: string
}

export default function BookingModal({
  isOpen,
  onClose,
  onSubmit,
  type,
  selectedDate,
  roomId,
}: BookingModalProps) {
  const [formData, setFormData] = useState<BookingData>({
    customerName: '',
    customerWA: '',
    type: type,
    startDate: selectedDate?.toISOString().split('T')[0] || '',
    endDate: '',
    roomId: roomId || '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        startDate: selectedDate.toISOString().split('T')[0],
      }))
    }
  }, [selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    onSubmit(formData)
    setIsSubmitting(false)
    onClose()

    // Reset form
    setFormData({
      customerName: '',
      customerWA: '',
      type: type,
      startDate: '',
      endDate: '',
      roomId: '',
      notes: '',
    })
  }

  const getIcon = () => {
    switch (type) {
      case 'hotel': return <Hotel size={20} />
      case 'aula': return <Building2 size={20} />
      case 'visa': return <Plane size={20} />
      case 'rental': return <Package size={20} />
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'hotel': return 'Book Hotel Room'
      case 'aula': return 'Book Auditorium'
      case 'visa': return 'Add Visa Inquiry'
      case 'rental': return 'Rent Equipment'
      default: return 'New Booking'
    }
  }

  // ═══ Hotel uses HotelBookingForm inside a wide Dialog ═══
  if (type === 'hotel') {
    return (
      <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-zinc-950 border-white/10 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/5">
            <DialogTitle className="flex items-center gap-3 text-lg text-foreground">
              <Hotel size={22} className="text-primary" />
              Book Hotel Room
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Fill in guest details and select rooms for the stay.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 p-4">
            <HotelBookingForm
              isModal={true}
              initialDate={selectedDate}
              onClose={onClose}
              onSuccess={() => {
                onSubmit({
                  customerName: 'Guest',
                  customerWA: '',
                  type: 'hotel',
                  startDate: '',
                  notes: 'Booked via Hotel Form',
                })
                onClose()
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ═══ Generic form for Aula / Visa / Rental ═══
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Isi data berikut untuk membuat booking baru.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nama Customer *</Label>
              <Input
                id="customerName"
                placeholder="Nama lengkap"
                value={formData.customerName}
                onChange={e =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerWA">WhatsApp *</Label>
              <Input
                id="customerWA"
                type="tel"
                placeholder="+62xxx atau +20xxx"
                value={formData.customerWA}
                onChange={e =>
                  setFormData({ ...formData, customerWA: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={e =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>
            {(type === 'aula' || type === 'rental') && (
              <div className="space-y-2">
                <Label htmlFor="endDate">Tanggal Selesai</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={e =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            )}
          </div>

          {type === 'rental' && (
            <div className="space-y-2">
              <Label htmlFor="itemId">Pilih Equipment</Label>
              <select
                id="itemId"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.itemId}
                onChange={e =>
                  setFormData({ ...formData, itemId: e.target.value })
                }
              >
                <option value="">-- Pilih Item --</option>
                <option value="projector">Projector (EGP 100/day)</option>
                <option value="sound">Sound System (EGP 150/day)</option>
                <option value="chairs">Kursi Lipat x50 (EGP 50/day)</option>
                <option value="tent">Tenda (EGP 200/day)</option>
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <textarea
              id="notes"
              className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-vertical"
              placeholder="Catatan tambahan..."
              rows={3}
              value={formData.notes}
              onChange={e =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <DialogFooter className="gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '⏳ Memproses...' : '✓ Simpan & Kirim Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
