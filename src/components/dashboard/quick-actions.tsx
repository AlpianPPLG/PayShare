"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Users, Receipt, CreditCard } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks to get you started</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild className="h-auto p-4 justify-start">
            <Link href="/dashboard/expenses/new">
              <div className="flex items-center space-x-3">
                <Receipt className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Add Expense</div>
                  <div className="text-xs text-muted-foreground">Record a new shared expense</div>
                </div>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-4 justify-start bg-transparent">
            <Link href="/dashboard/groups/new">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Create Group</div>
                  <div className="text-xs text-muted-foreground">Start a new expense group</div>
                </div>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-4 justify-start bg-transparent">
            <Link href="/dashboard/settlements/new">
              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Record Payment</div>
                  <div className="text-xs text-muted-foreground">Mark a debt as settled</div>
                </div>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-4 justify-start bg-transparent">
            <Link href="/dashboard/analytics">
              <div className="flex items-center space-x-3">
                <Plus className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">View Analytics</div>
                  <div className="text-xs text-muted-foreground">See spending insights</div>
                </div>
              </div>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
