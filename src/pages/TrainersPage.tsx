import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { isOnline } from '@/lib/utils'
import { Database } from '@/types/database'
import { MessageCircle } from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadTrainers()
  }, [])

  async function loadTrainers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_trainer', true)
      .order('last_seen_at', { ascending: false })

    if (error) {
      console.error('Error loading trainers:', error)
    } else {
      setTrainers(data || [])
    }
    setLoading(false)
  }

  const onlineTrainers = trainers.filter(t => isOnline(t.last_seen_at))
  const offlineTrainers = trainers.filter(t => !isOnline(t.last_seen_at))

  function getInitials(name: string | null) {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  function handleMessage(trainerId: string) {
    navigate('/messages', { state: { trainerId } })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Trainers</h1>

      {onlineTrainers.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Online
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {onlineTrainers.map((trainer, index) => (
              <motion.div
                key={trainer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={trainer.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(trainer.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{trainer.full_name || 'Unnamed'}</h3>
                    {trainer.trainer_role && (
                      <p className="text-sm text-gray-600">{trainer.trainer_role}</p>
                    )}
                  </div>
                </div>

                {trainer.trainer_specializations && trainer.trainer_specializations.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {trainer.trainer_specializations.map((spec, i) => (
                      <Badge key={i} variant="secondary">{spec}</Badge>
                    ))}
                  </div>
                )}

                {trainer.location && (
                  <p className="mt-3 text-sm text-gray-500">{trainer.location}</p>
                )}

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => handleMessage(trainer.id)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/trainers/${trainer.id}`)}
                  >
                    View Profile
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {offlineTrainers.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            Offline
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offlineTrainers.map((trainer, index) => (
              <motion.div
                key={trainer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={trainer.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(trainer.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-gray-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{trainer.full_name || 'Unnamed'}</h3>
                    {trainer.trainer_role && (
                      <p className="text-sm text-gray-600">{trainer.trainer_role}</p>
                    )}
                  </div>
                </div>

                {trainer.trainer_specializations && trainer.trainer_specializations.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {trainer.trainer_specializations.map((spec, i) => (
                      <Badge key={i} variant="secondary">{spec}</Badge>
                    ))}
                  </div>
                )}

                {trainer.location && (
                  <p className="mt-3 text-sm text-gray-500">{trainer.location}</p>
                )}

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => handleMessage(trainer.id)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/trainers/${trainer.id}`)}
                  >
                    View Profile
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {trainers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No trainers found
        </div>
      )}
    </div>
  )
}
