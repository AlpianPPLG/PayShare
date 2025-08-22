"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, UserPlus, Search } from "lucide-react"
import type { AuthUser } from "@/lib/types"
import { useI18n } from "@/lib/i18n/useI18n"

interface AddMemberDialogProps {
  groupId: number
  existingMemberIds: number[]
  onMemberAdded: () => void
}

export function AddMemberDialog({ groupId, existingMemberIds, onMemberAdded }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<AuthUser[]>([])
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState("")
  const { t } = useI18n()

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const token = localStorage.getItem("auth_token")
      const excludeIds = existingMemberIds.join(",")
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&exclude=${excludeIds}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setSearchResults(data.data.users)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchUsers(searchQuery)
    }, 300)

    return () => clearTimeout(debounceTimer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, existingMemberIds])

  const handleAddMember = async () => {
    if (!selectedUser) return

    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selectedUser.id }),
      })

      const data = await response.json()

      if (data.success) {
        setOpen(false)
        setSearchQuery("")
        setSelectedUser(null)
        setSearchResults([])
        onMemberAdded()
      } else {
        setError(data.error || "Failed to add member")
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          {t("addMember.open")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("addMember.title")}</DialogTitle>
          <DialogDescription>{t("addMember.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="search">{t("addMember.searchLabel")}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder={t("addMember.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="grid gap-2 max-h-48 overflow-y-auto">
              <Label>{t("addMember.resultsLabel")}</Label>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors ${
                    selectedUser?.id === user.id ? "bg-primary text-primary-foreground" : "hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
            <p className="text-sm text-muted-foreground text-center py-4">{t("addMember.noResults")}</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {t("groups.cancel")}
          </Button>
          <Button onClick={handleAddMember} disabled={!selectedUser || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("addMember.adding")}
              </>
            ) : (
              t("addMember.add")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
