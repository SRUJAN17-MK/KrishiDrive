import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { LANGUAGES, translations } from '../i18n/translations'

const LanguageContext = createContext(null)
const STORAGE_KEY = 'kd_language'

function detectInitial() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && translations[saved]) return saved
  const browser = (navigator.language || 'en').slice(0, 2).toLowerCase()
  return translations[browser] ? browser : 'en'
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(detectInitial)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language
    document.documentElement.dir = 'ltr'
  }, [language])

  const value = useMemo(() => {
    const dictionary = translations[language] || translations.en
    const fallback = translations.en
    function t(key, vars) {
      let text = dictionary[key] || fallback[key] || key
      if (vars) {
        Object.entries(vars).forEach(([name, replacement]) => {
          text = text.replaceAll(`{${name}}`, String(replacement))
        })
      }
      return text
    }
    const speechCode = (LANGUAGES.find((item) => item.code === language) || LANGUAGES[0]).speech
    return { language, setLanguage, t, speechCode, languages: LANGUAGES }
  }, [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
