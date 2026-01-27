import { createContext, useContext, useState, useEffect, useRef } from 'react'

const ThemeContext = createContext(null)

const THEMES = {
  default: 'default',
  dark: 'dark',
  retro: 'retro',
  techno: 'techno'
}

// Techno mode music - "I Want to be a Machine" YouTube link
const TECHNO_MUSIC_URL = 'https://www.youtube.com/watch?v=LIJrApKJhKs'

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme')
    return saved || THEMES.default
  })
  const [technoMusicPlaying, setTechnoMusicPlaying] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('app-theme', theme)

    // Remove all theme classes
    document.documentElement.classList.remove('theme-default', 'theme-dark', 'theme-retro', 'theme-techno')
    // Add current theme class
    document.documentElement.classList.add(`theme-${theme}`)

    // Handle techno music
    if (theme === THEMES.techno) {
      // Open YouTube in new tab when techno is first selected
      if (!technoMusicPlaying) {
        window.open(TECHNO_MUSIC_URL, '_blank')
        setTechnoMusicPlaying(true)
      }
    } else {
      setTechnoMusicPlaying(false)
    }
  }, [theme])

  // Reset music state when component unmounts or user leaves
  useEffect(() => {
    return () => {
      setTechnoMusicPlaying(false)
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, THEMES, technoMusicPlaying }}>
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
