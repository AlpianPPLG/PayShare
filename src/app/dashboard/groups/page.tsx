"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { CreateGroupDialog } from "@/components/groups/create-group-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Calendar, Eye } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { GroupWithMembers } from "@/lib/types"

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupWithMembers[]>([])
  const [loading, setLoading] = useState(true)

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/groups", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setGroups(data.data.groups)
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Groups</h1>
              <p className="text-muted-foreground">Manage your expense groups and members</p>
            </div>
            <CreateGroupDialog onGroupCreated={fetchGroups} />
          </div>

          {/* Groups Grid */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first group to start splitting expenses with others.
                </p>
                <CreateGroupDialog onGroupCreated={fetchGroups} />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <Card key={group.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        {group.description && <CardDescription className="mt-1">{group.description}</CardDescription>}
                      </div>
                      <Badge variant="secondary">{group.member_count} members</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Members Preview */}
                      <div className="flex items-center space-x-2">
                        <div className="flex -space-x-2">
                          {group.members.slice(0, 4).map((member) => (
                            <Avatar key={member.user_id} className="h-8 w-8 border-2 border-white">
                              <AvatarImage src="/placeholder.svg" />
                              <AvatarFallback className="text-xs">{getUserInitials(member.user_name)}</AvatarFallback>
                            </Avatar>
                          ))}
                          {group.member_count > 4 && (
                            <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                              <span className="text-xs text-gray-600">+{group.member_count - 4}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {group.members
                            .slice(0, 2)
                            .map((m) => m.user_name)
                            .join(", ")}
                          {group.member_count > 2 && ` and ${group.member_count - 2} others`}
                        </span>
                      </div>

                      {/* Group Info */}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        Created {formatDistanceToNow(new Date(group.created_at), { addSuffix: true })}
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button asChild size="sm" className="flex-1">
                          <Link href={`/dashboard/groups/${group.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
