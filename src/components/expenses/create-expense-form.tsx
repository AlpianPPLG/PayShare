/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { useI18n } from "@/lib/i18n/useI18n"
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

interface CreateExpenseFormProps {
  isEditMode?: boolean
  initialData?: {
    id?: number
    title: string
    description: string
    totalAmount: string
    category: string
    groupId: string
    paidBy: string
    splitMethod: 'equal' | 'exact' | 'percentage'
    expenseDate: string
    participants: Array<{
      user_id: number
      user_name: string
      amount?: number
      percentage?: number
    }>
  }
  onSuccess?: () => void
}

export function CreateExpenseForm({ isEditMode = false, initialData, onSuccess }: CreateExpenseFormProps) {
  const { user } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedGroupId = searchParams.get("group")
  const duplicateExpenseId = searchParams.get("duplicate")

  const [title, setTitle] = useState(initialData?.title || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [totalAmount, setTotalAmount] = useState(initialData?.totalAmount || "")
  const [category, setCategory] = useState(initialData?.category || "general")
  const [groupId, setGroupId] = useState(initialData?.groupId || preselectedGroupId || "")
  const [paidBy, setPaidBy] = useState(initialData?.paidBy || user?.id.toString() || "")
  const [splitMethod, setSplitMethod] = useState<"equal" | "exact" | "percentage">(
    initialData?.splitMethod || "equal"
  )
  const [expenseDate, setExpenseDate] = useState(
    initialData?.expenseDate || new Date().toISOString().split("T")[0]
  )
  const [participants, setParticipants] = useState<
    { user_id: number; user_name: string; amount?: number; percentage?: number }[]
  >(initialData?.participants || [])

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
    const fetchData = async () => {
      await fetchInitialData()
      
      // If duplicating an expense, fetch its data
      if (duplicateExpenseId) {
        await fetchExpenseToDuplicate(duplicateExpenseId)
      } else if (isEditMode && initialData) {
        // For edit mode, ensure we have the latest data for groups and categories
        await fetchInitialData()
      }
    }
    
    fetchData()
  }, [duplicateExpenseId, initialData, isEditMode])

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
    if (!title.trim()) return t('expenses.create.validation.titleRequired')
    if (!totalAmount || Number.parseFloat(totalAmount) <= 0) return t('expenses.create.validation.validAmountRequired')
    if (!paidBy) return t('expenses.create.validation.selectPayer')
    if (participants.length === 0) return t('expenses.create.validation.participantsRequired')

    if (splitMethod === "exact") {
      const totalSplit = participants.reduce((sum, p) => sum + (p.amount || 0), 0)
      if (Math.abs(totalSplit - Number.parseFloat(totalAmount)) > 0.01) {
        return t('expenses.create.validation.splitAmountsEqual')
      }
    }

    if (splitMethod === "percentage") {
      const totalPercentage = participants.reduce((sum, p) => sum + (p.percentage || 0), 0)
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return t('expenses.create.validation.percentagesEqual100')
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
      const url = isEditMode && initialData?.id 
        ? `/api/expenses/${initialData.id}` 
        : "/api/expenses"
      
      const method = isEditMode ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
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
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/dashboard/expenses")
        }
      } else {
        setError(data.error || `Failed to ${isEditMode ? 'update' : 'create'} expense`)
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setError(t('expenses.create.validation.networkError'))
    } finally {
      setLoading(false)
    }
  }

  const fetchExpenseToDuplicate = async (expenseId: string) => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")
      const response = await fetch(`/api/expenses/${expenseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()
      if (data.success) {
        const exp = data.data.expense
        
        // Set basic expense info
        setTitle(`${exp.title} (Copy)`)
        setDescription(exp.description)
        setTotalAmount(exp.total_amount.toString())
        setCategory(exp.category)
        setExpenseDate(new Date().toISOString().split("T")[0]) // Use current date for the duplicate
        
        // Set group if exists
        if (exp.group_id) {
          setGroupId(exp.group_id.toString())
        }
        
        // Set paid by
        setPaidBy(exp.paid_by.toString())
        
        // Set participants with their amounts/percentages
        const participantsData = exp.participants.map((p: any) => ({
          user_id: p.user_id,
          user_name: p.user_name,
          amount: p.amount_owed,
          percentage: p.percentage
        }))
        
        setParticipants(participantsData)
        
        // Set split method
        setSplitMethod(exp.split_method)
        
      } else {
        console.error("Failed to fetch expense to duplicate:", data.error)
      }
    } catch (error) {
      console.error("Error duplicating expense:", error)
    } finally {
      setLoading(false)
    }
  }

  const preview = calculatePreview()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode 
              ? t('expenses.create.editTitle') 
              : duplicateExpenseId 
                ? t('expenses.create.duplicateTitle') 
                : t('expenses.create.title')
            }
          </CardTitle>
          <CardDescription>
            {duplicateExpenseId 
              ? t('expenses.create.duplicateSubtitle')
              : t('expenses.create.subtitle')
            }
          </CardDescription>
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
                <Label htmlFor="title">{t('expenses.create.titleLabel')}</Label>
                <Input
                  id="title"
                  placeholder={t('expenses.create.titlePlaceholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">{t('expenses.create.amountLabel')}</Label>
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
                <Label htmlFor="category">{t('expenses.create.categoryLabel')}</Label>
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
                <Label htmlFor="date">{t('expenses.create.dateLabel')}</Label>
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
              <Label htmlFor="description">{t('expenses.create.descriptionLabel')}</Label>
              <Textarea
                id="description"
                placeholder={t('expenses.create.descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>

            {/* Group Selection */}
            <div className="space-y-2">
              <Label htmlFor="group">{t('expenses.create.groupLabel')}</Label>
              <Select value={groupId} onValueChange={setGroupId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder={t('expenses.create.groupPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('expenses.create.noGroup')}</SelectItem>
                  {groups.map((group) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  {group.name} ({group.member_count} {t('groups.members')})
                </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Paid By */}
            <div className="space-y-2">
              <Label htmlFor="paidBy">{t('expenses.create.paidByLabel')}</Label>
              <Select value={paidBy} onValueChange={setPaidBy} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length > 0 ? (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} {user.id.toString() === user?.id.toString() && "(You)"}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={paidBy}>
                      {participants.find(p => p.user_id.toString() === paidBy)?.user_name || `User ${paidBy}`}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Split Method */}
            <div className="space-y-4">
              <Label>{t('expenses.create.splitMethodLabel')}</Label>
              <div className="grid gap-3 md:grid-cols-3">
                <Card
                  className={`cursor-pointer transition-colors ${splitMethod === "equal" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSplitMethod("equal")}
                >
                  <CardContent className="p-4 text-center">
                    <h4 className="font-medium">{t('expenses.create.splitMethods.equal.label')}</h4>
                    <p className="text-sm text-muted-foreground">{t('expenses.create.splitMethods.equal.description')}</p>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-colors ${splitMethod === "exact" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSplitMethod("exact")}
                >
                  <CardContent className="p-4 text-center">
                    <h4 className="font-medium">{t('expenses.create.splitMethods.exact.label')}</h4>
                    <p className="text-sm text-muted-foreground">{t('expenses.create.splitMethods.exact.description')}</p>
                  </CardContent>
                </Card>
                <Card
                  className={`cursor-pointer transition-colors ${splitMethod === "percentage" ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSplitMethod("percentage")}
                >
                  <CardContent className="p-4 text-center">
                    <h4 className="font-medium">{t('expenses.create.splitMethods.percentage.label')}</h4>
                    <p className="text-sm text-muted-foreground">{t('expenses.create.splitMethods.percentage.description')}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Participants */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{t('expenses.create.participantsLabel')}</Label>
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
                    {t('expenses.create.addAllMembers')}
                  </Button>
                )}
              </div>

              {participants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('expenses.create.noParticipants')}</p>
                  <p className="text-sm">{t('expenses.create.selectGroupHint')}</p>
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
                            placeholder={t('expenses.create.splitMethods.exact.label')}
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
                            placeholder={t('expenses.create.splitMethods.percentage.label')}
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
                  <CardTitle className="text-lg">{t('expenses.create.previewTitle')}</CardTitle>
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
                      <span>{t('expenses.create.total')}</span>
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
                {t('expenses.create.actions.cancel')}
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode 
                      ? t('expenses.create.actions.updating') 
                      : duplicateExpenseId 
                        ? t('expenses.create.actions.duplicating') 
                        : t('expenses.create.actions.creating')
                    }
                  </>
                ) : (
                  isEditMode 
                    ? t('expenses.create.actions.update') 
                    : duplicateExpenseId 
                      ? t('expenses.create.actions.duplicate') 
                      : t('expenses.create.actions.create')
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
