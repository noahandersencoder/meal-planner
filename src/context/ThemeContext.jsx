import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

const THEMES = {
  default: 'default',
  dark: 'dark',
  retro: 'retro'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme')
    return saved || THEMES.default
  })

  useEffect(() => {
    localStorage.setItem('app-theme', theme)

    // Remove all theme classes
    document.documentElement.classList.remove('theme-default', 'theme-dark', 'theme-retro')
    // Add current theme class
    document.documentElement.classList.add(`theme-${theme}`)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
