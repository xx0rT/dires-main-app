import { useEffect, useState, useCallback } from 'react'
import {
  UserPlus,
  Search,
  X,
  Check,
  Edit2,
  UserCheck,
  UserX,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/admin/admin-motion'
import { Label } from '@/components/ui/label'

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  phone: string | null
  location: string | null
  is_trainer: boolean
  trainer_role: string | null
  trainer_specializations: string[] | null
  created_at: string
}

interface TrainerFormData {
  is_trainer: boolean
  trainer_role: string
  trainer_specializations: string[]
}

export default function AdminTrainersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<TrainerFormData>({
    is_trainer: false,
    trainer_role: '',
    trainer_specializations: [],
  })
  const [newSpecialization, setNewSpecialization] = useState('')

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    setProfiles(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const openEditDialog = (profile: Profile, makeTrainer = false) => {
    setSelectedUser(profile)
    setFormData({
      is_trainer: makeTrainer ? true : profile.is_trainer,
      trainer_role: profile.trainer_role || '',
      trainer_specializations: profile.trainer_specializations || [],
    })
    setEditMode(true)
  }

  const closeDialog = () => {
    setSelectedUser(null)
    setEditMode(false)
    setFormData({
      is_trainer: false,
      trainer_role: '',
      trainer_specializations: [],
    })
    setNewSpecialization('')
  }

  const saveTrainerSettings = async () => {
    if (!selectedUser) return

    const { error } = await supabase
      .from('profiles')
      .update({
        is_trainer: formData.is_trainer,
        trainer_role: formData.trainer_role,
        trainer_specializations: formData.trainer_specializations,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedUser.id)

    if (error) {
      toast.error('Chyba pri ukladani')
      return
    }

    toast.success('Trenér úspěšně upraven')
    await fetchProfiles()
    closeDialog()
  }

  const toggleTrainer = async (profile: Profile) => {
    const newStatus = !profile.is_trainer
    const { error } = await supabase
      .from('profiles')
      .update({ is_trainer: newStatus })
      .eq('id', profile.id)

    if (error) {
      toast.error('Chyba pri zmene statusu')
      return
    }

    toast.success(newStatus ? 'Uzivatel je nyni trener' : 'Trenér byl odebrán')
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profile.id ? { ...p, is_trainer: newStatus } : p
      )
    )
  }

  const addSpecialization = () => {
    if (!newSpecialization.trim()) return
    if (formData.trainer_specializations.includes(newSpecialization.trim())) {
      toast.error('Specializace již existuje')
      return
    }
    setFormData({
      ...formData,
      trainer_specializations: [
        ...formData.trainer_specializations,
        newSpecialization.trim(),
      ],
    })
    setNewSpecialization('')
  }

  const removeSpecialization = (spec: string) => {
    setFormData({
      ...formData,
      trainer_specializations: formData.trainer_specializations.filter(
        (s) => s !== spec
      ),
    })
  }

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.email?.toLowerCase().includes(q) ||
      p.full_name?.toLowerCase().includes(q) ||
      p.trainer_role?.toLowerCase().includes(q)
    )
  })

  const trainers = filtered.filter((p) => p.is_trainer)
  const nonTrainers = filtered.filter((p) => !p.is_trainer)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <AnimatedPage className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Správa trenérů
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {trainers.length} aktivních trenérů z {profiles.length} uživatelů
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative max-w-sm"
      >
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
        <Input
          placeholder="Hledat uživatele..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </motion.div>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Trenéři ({trainers.length})
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700">
                      <th className="px-4 py-3 text-left font-medium text-neutral-500">
                        Trenér
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-neutral-500">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-neutral-500">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-neutral-500">
                        Specializace
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-neutral-500">
                        Akce
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainers.map((profile) => (
                      <tr
                        key={profile.id}
                        className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarImage src={profile.avatar_url || ''} />
                              <AvatarFallback>
                                {(profile.full_name || profile.email)?.[0]?.toUpperCase() ||
                                  'T'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                              {profile.full_name || profile.email?.split('@')[0]}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                          {profile.email}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">
                            {profile.trainer_role || 'Neurčeno'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {profile.trainer_specializations &&
                            profile.trainer_specializations.length > 0 ? (
                              profile.trainer_specializations.map((spec) => (
                                <Badge
                                  key={spec}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {spec}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-neutral-400">
                                Žádné
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(profile)}
                            >
                              <Edit2 className="mr-1 size-3" />
                              Upravit
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => toggleTrainer(profile)}
                              title="Odebrat trenéra"
                            >
                              <UserX className="size-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {trainers.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-neutral-500"
                        >
                          Žádní trenéři
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Ostatní uživatelé ({nonTrainers.length})
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700">
                      <th className="px-4 py-3 text-left font-medium text-neutral-500">
                        Uživatel
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-neutral-500">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-neutral-500">
                        Registrace
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-neutral-500">
                        Akce
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonTrainers.map((profile) => (
                      <tr
                        key={profile.id}
                        className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarImage src={profile.avatar_url || ''} />
                              <AvatarFallback>
                                {(profile.full_name || profile.email)?.[0]?.toUpperCase() ||
                                  'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                              {profile.full_name || profile.email?.split('@')[0]}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                          {profile.email}
                        </td>
                        <td className="px-4 py-3 text-neutral-500">
                          {new Date(profile.created_at).toLocaleDateString('cs-CZ')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(profile, true)}
                          >
                            <UserPlus className="mr-1 size-3" />
                            Přidat jako trenéra
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {nonTrainers.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-neutral-500"
                        >
                          Všichni uživatelé jsou trenéři
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={editMode} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="size-5" />
              {selectedUser?.is_trainer ? 'Upravit trenéra' : 'Přidat trenéra'}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border p-3 dark:border-neutral-700">
                <Avatar className="size-12">
                  <AvatarImage src={selectedUser.avatar_url || ''} />
                  <AvatarFallback>
                    {(selectedUser.full_name || selectedUser.email)?.[0]?.toUpperCase() ||
                      'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {selectedUser.full_name || selectedUser.email?.split('@')[0]}
                  </p>
                  <p className="text-sm text-neutral-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trainer_role">Role trenéra</Label>
                <Input
                  id="trainer_role"
                  placeholder="např. Fyzioterapeut, Kondiční trenér..."
                  value={formData.trainer_role}
                  onChange={(e) =>
                    setFormData({ ...formData, trainer_role: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Specializace</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Přidat specializaci..."
                    value={newSpecialization}
                    onChange={(e) => setNewSpecialization(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSpecialization()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={addSpecialization}
                    disabled={!newSpecialization.trim()}
                  >
                    <Check className="size-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {formData.trainer_specializations.map((spec) => (
                    <Badge
                      key={spec}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => removeSpecialization(spec)}
                        className="ml-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeDialog}>
              Zrušit
            </Button>
            <Button onClick={saveTrainerSettings}>Uložit změny</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  )
}
