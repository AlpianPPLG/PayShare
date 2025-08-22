/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { useI18n } from "@/lib/i18n/useI18n"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Zap, Search, Plus, Minus } from "lucide-react"
import type { AuthUser, Category } from "@/lib/types"

interface QuickSplitDialogProps {
  onExpenseCreated: () => void
}

export function QuickSplitDialog({ onExpenseCreated }: QuickSplitDialogProps) {
  const { user } = useAuth()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1) // 1: Basic Info, 2: Add People, 3: Split Details

  // Form data
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [totalAmount, setTotalAmount] = useState("")
  const [category, setCategory] = useState("general")
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0])
  const [paidBy, setPaidBy] = useState(user?.id.toString() || "")
  const [splitMethod, setSplitMethod] = useState<"equal" | "exact" | "percentage">("equal")

  // People management
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<AuthUser[]>([])
  const [selectedPeople, setSelectedPeople] = useState<
    { user_id: number; user_name: string; user_email: string; amount?: number; percentage?: number }[]
  >([])

  // Data
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
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
    if (open) {
      fetchCategories()
      // Add current user to selected people by default
      if (user && selectedPeople.length === 0) {
        setSelectedPeople([{
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
        }])
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setCategories(data.data.categories)
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const searchUsers = async (query: string) => {
    setSearching(true)
    try {
      const token = localStorage.getItem("auth_token")
      const excludeIds = selectedPeople.map(p => p.user_id).join(",")
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&exclude=${excludeIds}`, {
        headers: { Authorization: `Bearer ${token}` },
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

  const addPerson = (person: AuthUser) => {
    setSelectedPeople([...selectedPeople, {
      user_id: person.id,
      user_name: person.name,
      user_email: person.email,
    }])
    setSearchQuery("")
    setSearchResults([])
  }

  const removePerson = (userId: number) => {
    setSelectedPeople(selectedPeople.filter(p => p.user_id !== userId))
    // If removed person was the payer, reset to current user
    if (paidBy === userId.toString()) {
      setPaidBy(user?.id.toString() || "")
    }
  }

  const updatePersonAmount = (userId: number, amount: number) => {
    setSelectedPeople(selectedPeople.map(p => 
      p.user_id === userId ? { ...p, amount } : p
    ))
  }

  const updatePersonPercentage = (userId: number, percentage: number) => {
    setSelectedPeople(selectedPeople.map(p => 
      p.user_id === userId ? { ...p, percentage } : p
    ))
  }

  const calculatePreview = () => {
    const amount = Number.parseFloat(totalAmount) || 0
    if (amount === 0 || selectedPeople.length === 0) return []

    switch (splitMethod) {
      case "equal":
        const equalAmount = amount / selectedPeople.length
        return selectedPeople.map(p => ({ ...p, owes: equalAmount }))

      case "exact":
        return selectedPeople.map(p => ({ ...p, owes: p.amount || 0 }))

      case "percentage":
        return selectedPeople.map(p => ({ ...p, owes: (amount * (p.percentage || 0)) / 100 }))

      default:
        return []
    }
  }

  const validateStep = () => {
    switch (step) {
      case 1:
        return title.trim() && totalAmount && Number.parseFloat(totalAmount) > 0
      case 2:
        return selectedPeople.length > 0
      case 3:
        if (splitMethod === "exact") {
          const totalSplit = selectedPeople.reduce((sum, p) => sum + (p.amount || 0), 0)
          return Math.abs(totalSplit - Number.parseFloat(totalAmount)) < 0.01
        }
        if (splitMethod === "percentage") {
          const totalPercentage = selectedPeople.reduce((sum, p) => sum + (p.percentage || 0), 0)
          return Math.abs(totalPercentage - 100) < 0.01
        }
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1)
      setError("")
    } else {
      setError("Please fill in all required fields correctly")
    }
  }

  const handleBack = () => {
    setStep(step - 1)
    setError("")
  }

  const handleSubmit = async () => {
    if (!validateStep()) {
      setError("Please check all fields")
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
          paid_by: paidBy,
          split_method: splitMethod,
          expense_date: expenseDate,
          participants: selectedPeople.map(p => ({
            user_id: p.user_id,
            amount: p.amount,
            percentage: p.percentage,
          })),
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Reset form
        setTitle("")
        setDescription("")
        setTotalAmount("")
        setCategory("general")
        setExpenseDate(new Date().toISOString().split("T")[0])
        setPaidBy(user?.id.toString() || "")
        setSplitMethod("equal")
        setSelectedPeople(user ? [{
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
        }] : [])
        setStep(1)
        setOpen(false)
        onExpenseCreated()
      } else {
        setError(data.error || "Failed to create expense")
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const preview = calculatePreview()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Zap className="h-4 w-4 mr-2" />
          {t('expenses.quickSplit')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('expenses.quickSplitDialog.title', { step })}</DialogTitle>
          <DialogDescription>
            {step === 1 && t('expenses.quickSplitDialog.subtitle')}
            {step === 2 && "Add people to split with"}
            {step === 3 && "Configure how to split the expense"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">{t('expenses.quickSplitDialog.expenseFor')}</Label>
                <Input
                  id="title"
                  placeholder={t('expenses.quickSplitDialog.expenseForPlaceholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="amount">{t('expenses.quickSplitDialog.howMuch')}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="category">{t('expenses.quickSplitDialog.category')}</Label>
                  <Select value={category} onValueChange={setCategory}>
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

                <div>
                  <Label htmlFor="date">{t('expenses.quickSplitDialog.when')}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">{t('expenses.quickSplitDialog.description')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('expenses.quickSplitDialog.descriptionPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 2: Add People */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Add people to split with</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />}
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                  {searchResults.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => addPerson(person)}
                    >
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback className="text-xs">{getUserInitials(person.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{person.name}</p>
                          <p className="text-xs text-muted-foreground">{person.email}</p>
                        </div>
                      </div>
                      <Plus className="h-4 w-4" />
                    </div>
                  ))}
                </div>
              )}

              {/* Selected People */}
              <div>
                <Label>Selected people ({selectedPeople.length})</Label>
                <div className="space-y-2 mt-2">
                  {selectedPeople.map((person) => (
                    <div key={person.user_id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback className="text-xs">{getUserInitials(person.user_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{person.user_name}</p>
                          <p className="text-xs text-muted-foreground">{person.user_email}</p>
                        </div>
                        {person.user_id === user?.id && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                      {person.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePerson(person.user_id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Split Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="paid-by">Who paid?</Label>
                <Select value={paidBy} onValueChange={setPaidBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedPeople.map((person) => (
                      <SelectItem key={person.user_id} value={person.user_id.toString()}>
                        {person.user_name} {person.user_id === user?.id && "(You)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>How should this be split?</Label>
                <div className="grid gap-2 mt-2">
                  {[
                    { value: "equal", label: "Split Equally", desc: "Everyone pays the same amount" },
                    { value: "exact", label: "Enter Exact Amounts", desc: "Specify how much each person owes" },
                    { value: "percentage", label: "By Percentage", desc: "Split by custom percentages" },
                  ].map((option) => (
                    <div
                      key={option.value}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        splitMethod === option.value ? "border-primary bg-primary/5" : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSplitMethod(option.value as any)}
                    >
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Split Configuration */}
              {splitMethod !== "equal" && (
                <div className="space-y-3">
                  <Label>Configure split amounts</Label>
                  {selectedPeople.map((person) => (
                    <div key={person.user_id} className="flex items-center space-x-3 p-2 border rounded">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback className="text-xs">{getUserInitials(person.user_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{person.user_name}</p>
                      </div>
                      <div className="w-24">
                        {splitMethod === "exact" && (
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Amount"
                            value={person.amount || ""}
                            onChange={(e) => updatePersonAmount(person.user_id, Number.parseFloat(e.target.value) || 0)}
                          />
                        )}
                        {splitMethod === "percentage" && (
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="%"
                            value={person.percentage || ""}
                            onChange={(e) => updatePersonPercentage(person.user_id, Number.parseFloat(e.target.value) || 0)}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview */}
              {preview.length > 0 && (
                <div className="border rounded p-3 bg-gray-50">
                  <Label className="text-sm font-medium">Split Preview</Label>
                  <div className="space-y-2 mt-2">
                    {preview.map((item) => (
                      <div key={item.user_id} className="flex justify-between text-sm">
                        <span>{item.user_name}</span>
                        <span className="font-medium">{formatCurrency(item.owes)}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>{formatCurrency(Number.parseFloat(totalAmount) || 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t('expenses.quickSplitDialog.cancel')}
              </Button>
              {step < 3 ? (
                <Button onClick={handleNext} disabled={!validateStep()}>
                  {t('expenses.quickSplitDialog.next')}
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading || !validateStep()}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Expense"
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}