import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTrainerRole, setEditingTrainerRole] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading profiles:', error)
    } else {
      setProfiles(data || [])
    }
    setLoading(false)
  }

  async function toggleTrainer(profileId: string, currentValue: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_trainer: !currentValue })
      .eq('id', profileId)

    if (error) {
      console.error('Error updating trainer status:', error)
    } else {
      loadProfiles()
    }
  }

  async function toggleAdmin(profileId: string, currentValue: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !currentValue })
      .eq('id', profileId)

    if (error) {
      console.error('Error updating admin status:', error)
    } else {
      loadProfiles()
    }
  }

  async function updateTrainerRole(profileId: string, role: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ trainer_role: role })
      .eq('id', profileId)

    if (error) {
      console.error('Error updating trainer role:', error)
    } else {
      setEditingTrainerRole(prev => {
        const next = { ...prev }
        delete next[profileId]
        return next
      })
      loadProfiles()
    }
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
      <h1 className="text-3xl font-bold mb-8">User Management</h1>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trainer Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {profile.full_name || 'No name'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{profile.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    {profile.is_admin && <Badge>Admin</Badge>}
                    {profile.is_trainer && <Badge variant="secondary">Trainer</Badge>}
                    {!profile.is_admin && !profile.is_trainer && (
                      <Badge variant="outline">User</Badge>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {profile.is_trainer && (
                    <div className="flex gap-2">
                      {editingTrainerRole[profile.id] !== undefined ? (
                        <>
                          <Input
                            value={editingTrainerRole[profile.id]}
                            onChange={(e) =>
                              setEditingTrainerRole({
                                ...editingTrainerRole,
                                [profile.id]: e.target.value,
                              })
                            }
                            placeholder="e.g., Fyzioterapeut"
                            className="w-48"
                          />
                          <Button
                            size="sm"
                            onClick={() =>
                              updateTrainerRole(profile.id, editingTrainerRole[profile.id])
                            }
                          >
                            Save
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-gray-600">
                            {profile.trainer_role || 'Not set'}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setEditingTrainerRole({
                                ...editingTrainerRole,
                                [profile.id]: profile.trainer_role || '',
                              })
                            }
                          >
                            Edit
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={profile.is_trainer ? "default" : "outline"}
                      onClick={() => toggleTrainer(profile.id, profile.is_trainer)}
                    >
                      {profile.is_trainer ? 'Remove Trainer' : 'Make Trainer'}
                    </Button>
                    <Button
                      size="sm"
                      variant={profile.is_admin ? "destructive" : "outline"}
                      onClick={() => toggleAdmin(profile.id, profile.is_admin)}
                    >
                      {profile.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
