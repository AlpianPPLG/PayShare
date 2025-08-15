import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard - Expense Splitter",
  description: "Manage your shared expenses and groups",
}

export default function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
