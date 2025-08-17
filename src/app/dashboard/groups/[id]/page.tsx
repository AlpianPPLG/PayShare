"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AddMemberDialog } from "@/components/groups/add-member-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Calendar, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { GroupWithMembers } from "@/lib/types"

export default function GroupDetailPage() {
  const params = useParams()
  const groupId = Number.parseInt(params.id as string)
  const [group, setGroup] = useState<GroupWithMembers | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const fetchGroup = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch(`/api/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setGroup(data.data.group)
      } else {
        setError(data.error || "Failed to load group")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (groupId) {
      fetchGroup()
    }
  }, [groupId])

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Skeleton className="h-96" />
              </div>
              <Skeleton className="h-96" />
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error || !group) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-6">
            <Button variant="ghost" asChild>
              <Link href="/dashboard/groups">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Groups
              </Link>
            </Button>
            <Alert variant="destructive">
              <AlertDescription>{error || "Group not found"}</AlertDescription>
            </Alert>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard/groups">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Groups
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
                {group.description && <p className="text-muted-foreground">{group.description}</p>}
              </div>
            </div>
            <AddMemberDialog
              groupId={group.id}
              existingMemberIds={group.members.map((m) => m.user_id)}
              onMemberAdded={fetchGroup}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Members List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Members ({group.member_count})
                  </CardTitle>
                  <CardDescription>People in this expense group</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {group.members.map((member) => (
                      <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>{getUserInitials(member.user_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.user_name}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="h-3 w-3 mr-1" />
                              {member.user_email}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {member.user_id === group.created_by && <Badge variant="secondary">Admin</Badge>}
                          <p className="text-xs text-muted-foreground mt-1">
                            Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Group Info Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Group Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created by</p>
                    <p className="font-medium">{group.created_by_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <p>{formatDistanceToNow(new Date(group.created_at), { addSuffix: true })}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                    <p className="font-medium">{group.member_count} people</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/expenses/new?group=${group.id}`}>Add Expense</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href={`/dashboard/expenses?group=${group.id}`}>View Expenses</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href={`/dashboard/settlements`}>View Balances</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
