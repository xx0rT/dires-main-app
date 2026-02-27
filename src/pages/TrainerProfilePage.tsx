import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { isOnline } from '@/lib/utils'
import { Database } from '@/types/database'
import { ArrowLeft, MessageCircle } from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function TrainerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [trainer, setTrainer] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadTrainer(id)
    }
  }, [id])

  async function loadTrainer(trainerId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', trainerId)
      .maybeSingle()

    if (error) {
      console.error('Error loading trainer:', error)
    } else {
      setTrainer(data)
    }
    setLoading(false)
  }

  function getInitials(name: string | null) {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  function handleMessage() {
    if (trainer) {
      navigate('/messages', { state: { trainerId: trainer.id } })
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!trainer) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">Trainer not found</div>
      </div>
    )
  }

  const online = isOnline(trainer.last_seen_at)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => navigate('/trainers')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to trainers
      </Button>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-start gap-6 mb-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={trainer.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">{getInitials(trainer.full_name)}</AvatarFallback>
            </Avatar>
            <div
              className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white ${
                online ? 'bg-green-500' : 'bg-gray-400'
              }`}
            ></div>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">{trainer.full_name || 'Unnamed'}</h1>
                {trainer.trainer_role && (
                  <p className="text-lg text-gray-600 mt-1">{trainer.trainer_role}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {online ? (
                    <span className="text-sm text-green-600 font-medium">Online</span>
                  ) : (
                    <span className="text-sm text-gray-500">Offline</span>
                  )}
                </div>
              </div>
              <Button onClick={handleMessage}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Send message
              </Button>
            </div>
          </div>
        </div>

        {trainer.bio && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">About</h2>
            <p className="text-gray-700">{trainer.bio}</p>
          </div>
        )}

        {trainer.trainer_specializations && trainer.trainer_specializations.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Specializations</h2>
            <div className="flex flex-wrap gap-2">
              {trainer.trainer_specializations.map((spec, i) => (
                <Badge key={i} variant="secondary">{spec}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
          {trainer.location && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
              <p className="text-gray-900">{trainer.location}</p>
            </div>
          )}

          {trainer.company && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Company</h3>
              <p className="text-gray-900">{trainer.company}</p>
            </div>
          )}

          {trainer.phone && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
              <p className="text-gray-900">{trainer.phone}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Member since</h3>
            <p className="text-gray-900">
              {new Date(trainer.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
