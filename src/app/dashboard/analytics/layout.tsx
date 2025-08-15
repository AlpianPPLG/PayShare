import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analytics - Expense Splitter",
  description: "View spending insights and financial reports",
}

export default function AnalyticsLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
