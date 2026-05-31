import React, { createContext, useContext, useState, useCallback } from 'react'
import { getLang } from './i18n.js'

const LangContext = createContext({ lang: 'en', changeLang: () => {} })

export function LangProvider({ children }) {
  const [lang, setLang] = useState(getLang)

  const changeLang = useCallback((code) => {
    localStorage.setItem('roadsos_lang', code)
    setLang(code)
  }, [])

  return <LangContext.Provider value={{ lang, changeLang }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}

/** Returns a translator bound to current context language. */
export function useT() {
  const { lang } = useLang()
  return (key) => {
    // Dynamic import avoided — use the dict directly
    const { t } = require('./i18n.js')
    return t(key)
  }
}
