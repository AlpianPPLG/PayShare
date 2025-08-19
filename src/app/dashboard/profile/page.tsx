"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/hooks/use-auth"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useI18n } from "@/lib/i18n/useI18n"

export default function ProfileSettingsPage() {
  const { t } = useI18n()
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)

  const getUserInitials = (fullName: string) =>
    fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
      setPhone(user.phone || "")
    }
  }, [user])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    try {
      setSaving(true)
      const res = await updateProfile({ name: name.trim(), phone: phone || undefined })
      if (res.success) {
        toast.success("Profile updated")
      } else {
        toast.error(res.error || "Failed to update profile")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Link>
            <h1 className="text-3xl font-bold text-foreground">{t('profile.pageTitle')}</h1>
          </div>
          <div>
            <p className="text-muted-foreground">{t('profile.pageSubtitle')}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('profile.profile')}</CardTitle>
              <CardDescription>{t('profile.updateBasicInfo')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-6 md:grid-cols-3" onSubmit={onSubmit}>
                <div className="md:col-span-1">
                  <div className="flex flex-col items-center text-center gap-3">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{getUserInitials(user?.name || "U")}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-muted-foreground">{t('profile.avatarManaged')}</p>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">{t('profile.name')}</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">{t('profile.email')}</Label>
                    <Input id="email" value={email} disabled readOnly />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">{t('profile.phone')}</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? t('profile.saving') : t('profile.saveChanges')}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
