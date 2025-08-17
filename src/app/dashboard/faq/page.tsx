"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useI18n } from "@/lib/i18n/useI18n"

export default function FAQPage() {
  const { t } = useI18n()
  const raw = t("faq.items")
  const items: { q: string; a: string }[] = Array.isArray(raw) ? raw : []

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("faq.title")}</h1>
            <p className="text-muted-foreground">{t("faq.subtitle")}</p>
          </div>

          <div className="space-y-4">
            {items?.map((it, idx) => (
              <details key={idx} className="group rounded-lg border border-border bg-card p-4" open={idx === 0}>
                <summary className="cursor-pointer list-none text-foreground font-medium">
                  {it.q}
                </summary>
                <div className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                  {it.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
