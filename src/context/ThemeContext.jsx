import { createContext, useContext, useState, useEffect, useRef } from 'react'

const ThemeContext = createContext(null)

const THEMES = {
  default: 'default',
  dark: 'dark',
  retro: 'retro',
  techno: 'techno'
}

// Techno mode music - "I Want to be a Machine" YouTube embed
const TECHNO_VIDEO_ID = 'BOEm1ZmvTCs'

function TechnoPlayer({ playing, onClose }) {
  const [minimized, setMinimized] = useState(false)

  if (!playing) return null

  return (
    <div className={`fixed z-50 shadow-2xl transition-all ${
      minimized
        ? 'bottom-24 right-4 w-12 h-12 rounded-full'
        : 'bottom-24 right-4 w-72 rounded-xl overflow-hidden'
    }`}>
      {minimized ? (
        <button
          onClick={() => setMinimized(false)}
          className="w-12 h-12 rounded-full bg-black border-2 border-cyan-400 flex items-center justify-center text-xl animate-pulse"
          title="Expand player"
        >
          🎵
        </button>
      ) : (
        <div className="bg-black border-2 border-cyan-400 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-900">
            <span className="text-cyan-400 text-xs font-mono truncate flex-1">
              Now Playing: I Want to be a Machine
            </span>
            <div className="flex gap-1 ml-2">
              <button
                onClick={() => setMinimized(true)}
                className="text-cyan-400 hover:text-cyan-300 text-sm px-1"
                title="Minimize"
              >
                _
              </button>
              <button
                onClick={onClose}
                className="text-cyan-400 hover:text-red-400 text-sm px-1"
                title="Stop music"
              >
                x
              </button>
            </div>
          </div>
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${TECHNO_VIDEO_ID}?autoplay=1&loop=1&list=RD${TECHNO_VIDEO_ID}`}
              title="Techno Mode Music"
              width="100%"
              height="100%"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="border-0"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme')
    return saved || THEMES.default
  })
  const [technoMusicPlaying, setTechnoMusicPlaying] = useState(false)

  useEffect(() => {
    localStorage.setItem('app-theme', theme)

    // Remove all theme classes
    document.documentElement.classList.remove('theme-default', 'theme-dark', 'theme-retro', 'theme-techno')
    // Add current theme class
    document.documentElement.classList.add(`theme-${theme}`)

    // Handle techno music
    if (theme === THEMES.techno) {
      setTechnoMusicPlaying(true)
    } else {
      setTechnoMusicPlaying(false)
    }
  }, [theme])

  const stopTechnoMusic = () => {
    setTechnoMusicPlaying(false)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, THEMES, technoMusicPlaying }}>
      {children}
      <TechnoPlayer playing={technoMusicPlaying} onClose={stopTechnoMusic} />
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
