"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Minus, Users } from "lucide-react"
import type { GroupWithMembers, Category, AuthUser } from "@/lib/types"

export function CreateExpenseForm() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedGroupId = searchParams.get("group")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [totalAmount, setTotalAmount] = useState("")
  const [category, setCategory] = useState("general")
  const [groupId, setGroupId] = useState(preselectedGroupId || "")
  const [paidBy, setPaidBy] = useState(user?.id.toString() || "")
  const [splitMethod, setSplitMethod] = useState<"equal" | "exact" | "percentage">("equal")
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0])
  const [participants, setParticipants] = useState<
    { user_id: number; user_name: string; amount?: number; percentage?: number }[]
  >([])

  const [groups, setGroups] = useState<GroupWithMembers[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [availableUsers, setAvailableUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (groupId) {
      const selectedGroup = groups.find((g) => g.id.toString() === groupId)
      if (selectedGroup) {
        const groupUsers = selectedGroup.members.map((m) => ({
          user_id: m.user_id,
          user_name: m.user_name,
        }))
        setParticipants(groupUsers)
        setAvailableUsers(
          selectedGroup.members.map((m) => ({
            id: m.user_id,
            name: m.user_name,
            email: m.user_email,
          })),
        )
      }
    } else {
      setParticipants([])
      setAvailableUsers([])
    }
  }, [groupId, groups])

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem("auth_token")

      // Fetch groups
      const groupsResponse = await fetch("/api/groups", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const groupsData = await groupsResponse.json()
      if (groupsData.success) {
        setGroups(groupsData.data.groups)
      }

      // Fetch categories
      const categoriesResponse = await fetch("/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const categoriesData = await categoriesResponse.json()
      if (categoriesData.success) {
        setCategories(categoriesData.data.categories)
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error)
    }
  }

  const addParticipant = (userId: number, userName: string) => {
    if (!participants.find((p) => p.user_id === userId)) {
      setParticipants([...participants, { user_id: userId, user_name: userName }])
    }
  }

  const removeParticipant = (userId: number) => {
    setParticipants(participants.filter((p) => p.user_id !== userId))
  }

  const updateParticipantAmount = (userId: number, amount: number) => {
    setParticipants(participants.map((p) => (p.user_id === userId ? { ...p, amount } : p)))
  }

  const updateParticipantPercentage = (userId: number, percentage: number) => {
    setParticipants(participants.map((p) => (p.user_id === userId ? { ...p, percentage } : p)))
  }

  const calculatePreview = () => {
    const amount = Number.parseFloat(totalAmount) || 0
    if (amount === 0 || participants.length === 0) return []

    switch (splitMethod) {
      case "equal":
        const equalAmount = amount / participants.length
        return participants.map((p) => ({ ...p, owes: equalAmount }))

      case "exact":
        return participants.map((p) => ({ ...p, owes: p.amount || 0 }))

      case "percentage":
        return participants.map((p) => ({ ...p, owes: (amount * (p.percentage || 0)) / 100 }))

      default:
        return []
    }
  }

  const validateForm = () => {
    if (!title.trim()) return "Title is required"
    if (!totalAmount || Number.parseFloat(totalAmount) <= 0) return "Valid amount is required"
    if (!paidBy) return "Please select who paid"
    if (participants.length === 0) return "At least one participant is required"

    if (splitMethod === "exact") {
      const totalSplit = participants.reduce((sum, p) => sum + (p.amount || 0), 0)
      if (Math.abs(totalSplit - Number.parseFloat(totalAmount)) > 0.01) {
        return "Split amounts must equal total amount"
      }
    }

    if (splitMethod === "percentage") {
      const totalPercentage = participants.reduce((sum, p) => sum + (p.percentage || 0), 0)
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return "Percentages must add up to 100%"
      }
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          total_amount: totalAmount,
          currency: "IDR",
          category,
          group_id: groupId || null,
          paid_by: paidBy,
          split_method: splitMethod,
          expense_date: expenseDate,
          participants: participants.map((p) => ({
            user_id: p.user_id,
            amount: p.amount,
            percentage: p.percentage,
          })),
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push("/dashboard/expenses")
      } else {
        setError(data.error || "Failed to create expense")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const preview = calculatePreview()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Expense</CardTitle>
          <CardDescription>Record a shared expense and split it among participants</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Basic Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Expense Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Dinner at Restaurant"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Total Amount (IDR)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name.toLowerCase().replace(/\s+/g, "_")}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Expense Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Additional details about this expense..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>

            {/* Group Selection */}
            <div className="space-y-2">
              <Label htmlFor="group">Group (Optional)</Label>
              <Select value={groupId} onValueChange={setGroupId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a group or leave empty for personal expense" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Group (Personal)</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name} ({group.member_count} members)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Paid By */}
            <div className="space-y-2">
              <Label htmlFor="paidBy">Paid By</Label>
              <Select value={paidBy} onValueChange={setPaidBy} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} {user.id.toString() === user?.id.toString() && "(You)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Split Method */}
            <div className="space-y-4">
              <Label>Split Method</Label>
              <div className="grid gap-3 md:grid-cols-3">
                <Card
                  className={`cursor-pointer transition-colors ${splitMethod === "equal" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSplitMethod("equal")}
                >
                  <CardContent className="p-4 text-center">
                    <h4 className="font-medium">Equal Split</h4>
                    <p className="text-sm text-muted-foreground">Split equally among all participants</p>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-colors ${splitMethod === "exact" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSplitMethod("exact")}
                >
                  <CardContent className="p-4 text-center">
                    <h4 className="font-medium">Exact Amounts</h4>
                    <p className="text-sm text-muted-foreground">Specify exact amount for each person</p>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-colors ${splitMethod === "percentage" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSplitMethod("percentage")}
                >
                  <CardContent className="p-4 text-center">
                    <h4 className="font-medium">Percentage</h4>
                    <p className="text-sm text-muted-foreground">Split by custom percentages</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Participants */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Participants</Label>
                {groupId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const selectedGroup = groups.find((g) => g.id.toString() === groupId)
                      if (selectedGroup) {
                        const allMembers = selectedGroup.members.map((m) => ({
                          user_id: m.user_id,
                          user_name: m.user_name,
                        }))
                        setParticipants(allMembers)
                      }
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Add All Group Members
                  </Button>
                )}
              </div>

              {participants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No participants added yet</p>
                  <p className="text-sm">Select a group to add members automatically</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div key={participant.user_id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback className="text-xs">{getUserInitials(participant.user_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{participant.user_name}</p>
                      </div>

                      {splitMethod === "exact" && (
                        <div className="w-32">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            value={participant.amount || ""}
                            onChange={(e) =>
                              updateParticipantAmount(participant.user_id, Number.parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      )}

                      {splitMethod === "percentage" && (
                        <div className="w-32">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Percentage"
                            value={participant.percentage || ""}
                            onChange={(e) =>
                              updateParticipantPercentage(participant.user_id, Number.parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParticipant(participant.user_id)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Split Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {preview.map((item) => (
                      <div key={item.user_id} className="flex justify-between items-center">
                        <span>{item.user_name}</span>
                        <Badge variant="outline">{formatCurrency(item.owes)}</Badge>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center font-medium">
                      <span>Total</span>
                      <span>{formatCurrency(Number.parseFloat(totalAmount) || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit */}
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Expense"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
