import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { useToast } from '@/components/ui/use-toast'
import { User, Mail, Shield, Sun, Moon, Bell, Lock, CheckCircle } from 'lucide-react'

export default function PersonalSettings() {
  const { profile, fetchProfile, user } = useAuthStore()
  const { theme, setTheme } = useUiStore()
  const { toast } = useToast()
  const qc = useQueryClient()

  const [profileForm, setProfileForm] = useState({
    full_name: '', phone: '', timezone: 'Asia/Kolkata', locale: 'en-IN',
  })
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        timezone: profile.timezone || 'Asia/Kolkata',
        locale: profile.locale || 'en-IN',
      })
    }
  }, [profile])

  const profileMutation = useMutation({
    mutationFn: (data) => api.put(`/api/profiles/${profile.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['profiles'])
      if (profile?.id) fetchProfile(profile.id)
      toast({ title: 'Profile updated!' })
    },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const handlePasswordChange = async () => {
    if (!pwForm.newPw || pwForm.newPw !== pwForm.confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' }); return
    }
    if (pwForm.newPw.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' }); return
    }
    setPwLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPw })
      if (error) throw error
      toast({ title: 'Password updated!' })
      setPwForm({ current: '', newPw: '', confirm: '' })
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setPwLoading(false)
    }
  }

  const timezones = ['Asia/Kolkata', 'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Singapore', 'Asia/Tokyo']
  const locales = [['en-IN', 'English (India)'], ['en-US', 'English (US)'], ['en-GB', 'English (UK)']]

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
          {(profile?.full_name || profile?.email || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold">{profile?.full_name || 'Your Profile'}</h1>
          <div className="text-sm text-muted-foreground">{user?.email}</div>
          <Badge variant="outline" className="capitalize mt-1 text-xs">{profile?.role || 'member'}</Badge>
        </div>
      </div>

      {/* Profile info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><User className="w-4 h-4" /> Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <Label>Full Name</Label>
              <Input value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <Label>Phone</Label>
              <Input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Timezone</Label>
              <Select value={profileForm.timezone} onValueChange={v => setProfileForm(f => ({ ...f, timezone: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Locale</Label>
              <Select value={profileForm.locale} onValueChange={v => setProfileForm(f => ({ ...f, locale: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{locales.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-3.5 h-3.5" />{user?.email}
            <span className="text-xs">(cannot change)</span>
          </div>
          <Button onClick={() => profileMutation.mutate(profileForm)} disabled={profileMutation.isPending}>
            {profileMutation.isPending ? 'Saving…' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-2 ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground'}`}
            >
              <Sun className="w-5 h-5" />
              <span className="text-sm font-medium">Light</span>
              {theme === 'light' && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-2 ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground'}`}
            >
              <Moon className="w-5 h-5" />
              <span className="text-sm font-medium">Dark</span>
              {theme === 'dark' && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>New Password</Label>
            <Input type="password" value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} placeholder="At least 8 characters" />
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <Input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
            {pwForm.newPw && pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
              <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
            )}
          </div>
          <Button onClick={handlePasswordChange} disabled={pwLoading || !pwForm.newPw}>
            {pwLoading ? 'Updating…' : 'Update Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><Shield className="w-4 h-4" /> Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs">{user?.id?.slice(0, 12)}…</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="outline" className="capitalize text-xs">{profile?.role || 'member'}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Created</span>
            <span className="text-xs">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Sign In</span>
            <span className="text-xs">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '—'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
