/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Globe } from "lucide-react"
import { useI18n } from "@/lib/i18n/useI18n"
import { Button } from "@/components/ui/button"

export function LanguageToggle() {
  const { locale, setLocale } = useI18n()
  const next = locale === "en" ? "id" : "en"

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-8 w-8"
      aria-label={`Switch language to ${next}`}
      title={`Switch language to ${next.toUpperCase()}`}
      onClick={() => setLocale(next as any)}
    >
      <Globe className="h-4 w-4" />
    </Button>
  )
}
