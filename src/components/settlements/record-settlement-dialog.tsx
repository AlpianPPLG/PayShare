"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
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
import { Loader2, CreditCard } from "lucide-react"
import type { UserBalance } from "@/lib/types"

interface RecordSettlementDialogProps {
  balances: UserBalance[]
  onSettlementRecorded: () => void
}

export function RecordSettlementDialog({ balances, onSettlementRecorded }: RecordSettlementDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [fromUserId, setFromUserId] = useState("")
  const [toUserId, setToUserId] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split("T")[0])
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

  // Get users who owe money (positive net_balance)
  const usersWhoOwe = balances.filter((b) => b.net_balance > 0)
  // Get users who are owed money (negative net_balance)
  const usersWhoAreOwed = balances.filter((b) => b.net_balance < 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!fromUserId || !toUserId || !amount) {
      setError("Please fill in all required fields")
      setLoading(false)
      return
    }

    if (fromUserId === toUserId) {
      setError("Cannot record payment to yourself")
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch("/api/settlements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          amount: Number.parseFloat(amount),
          currency: "IDR",
          notes,
          settlement_date: settlementDate,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setOpen(false)
        setFromUserId("")
        setToUserId("")
        setAmount("")
        setNotes("")
        setSettlementDate(new Date().toISOString().split("T")[0])
        onSettlementRecorded()
      } else {
        setError(data.error || "Failed to record settlement")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  // Auto-fill amount based on selected users
  useEffect(() => {
    if (fromUserId && toUserId) {
      const fromUser = balances.find((b) => b.user_id.toString() === fromUserId)
      const toUser = balances.find((b) => b.user_id.toString() === toUserId)

      if (fromUser && toUser) {
        // If fromUser owes toUser, suggest the amount owed
        if (fromUser.net_balance > 0 && toUser.net_balance < 0) {
          const suggestedAmount = Math.min(fromUser.total_owes, toUser.total_owed)
          setAmount(suggestedAmount.toString())
        }
      }
    }
  }, [fromUserId, toUserId, balances])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CreditCard className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Settlement</DialogTitle>
          <DialogDescription>Record a payment between users to settle debts.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="from">Who paid?</Label>
              <Select value={fromUserId} onValueChange={setFromUserId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select who made the payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={user?.id.toString() || ""}>{user?.name} (You)</SelectItem>
                  {balances
                    .filter((b) => b.user_id !== user?.id)
                    .map((balance) => (
                      <SelectItem key={balance.user_id} value={balance.user_id.toString()}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="text-xs">{getUserInitials(balance.user_name)}</AvatarFallback>
                          </Avatar>
                          <span>{balance.user_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="to">Who received the payment?</Label>
              <Select value={toUserId} onValueChange={setToUserId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select who received the payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={user?.id.toString() || ""}>{user?.name} (You)</SelectItem>
                  {balances
                    .filter((b) => b.user_id !== user?.id)
                    .map((balance) => (
                      <SelectItem key={balance.user_id} value={balance.user_id.toString()}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="text-xs">{getUserInitials(balance.user_name)}</AvatarFallback>
                          </Avatar>
                          <span>{balance.user_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (IDR)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Settlement Date</Label>
              <Input
                id="date"
                type="date"
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this payment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Payment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
