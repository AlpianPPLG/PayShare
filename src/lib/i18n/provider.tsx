"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export type Locale = "en" | "id"

type Dict = Record<string, any>

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => any
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en"
  const stored = window.localStorage.getItem("locale") as Locale | null
  if (stored === "en" || stored === "id") return stored
  const nav = navigator.language?.toLowerCase() || "en"
  if (nav.startsWith("id")) return "id"
  return "en"
}

function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str
  return str.replace(/\{(.*?)\}/g, (_, k) => String(params[k] ?? ""))
}

function getByPath(obj: Dict, path: string): string | undefined {
  return path.split(".").reduce<any>((acc, part) => (acc ? acc[part] : undefined), obj)
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)
  const [dict, setDict] = useState<Dict>({})

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("locale", l)
      document.documentElement.lang = l
    }
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      const data: Dict = await (locale === "id"
        ? import("@/i18n/id.json").then((m) => m.default)
        : import("@/i18n/en.json").then((m) => m.default))
      if (active) setDict(data)
    }
    load()
    return () => {
      active = false
    }
  }, [locale])

  useEffect(() => {
    // Ensure <html lang> is in sync
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale
    }
  }, [locale])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const raw = getByPath(dict, key)
      if (raw === undefined) return key
      if (typeof raw === "string") return interpolate(raw, params)
      return raw
    },
    [dict],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18nContext() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18nContext must be used within I18nProvider")
  return ctx
}
