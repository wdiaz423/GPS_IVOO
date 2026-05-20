'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Loader } from 'lucide-react'

export default function VehiclesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [vehicles, setVehicles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    license_plate: '',
    vehicle_type: 'sedan',
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('/api/vehicles')
        if (response.ok) {
          const data = await response.json()
          setVehicles(data.vehicles || [])
        }
      } catch (error) {
        console.error('[v0] Error fetching vehicles:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchVehicles()
    }
  }, [user])

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setVehicles([...vehicles, data.vehicle])
        setFormData({ name: '', license_plate: '', vehicle_type: 'sedan' })
        setShowForm(false)
      }
    } catch (error) {
      console.error('[v0] Error adding vehicle:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Mis Vehículos</h1>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            Agregar Vehículo
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAddVehicle}
            className="bg-card p-6 rounded-lg mb-6 border border-border"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Placa
                </label>
                <input
                  type="text"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Crear Vehículo</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="flex justify-center">
            <Loader className="animate-spin" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">No tienes vehículos registrados</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {vehicles.map((vehicle: any) => (
              <div key={vehicle.id} className="bg-card p-4 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground">{vehicle.name}</h3>
                <p className="text-sm text-muted-foreground">{vehicle.license_plate}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tipo: {vehicle.vehicle_type}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
