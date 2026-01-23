import { useTheme } from '../context/ThemeContext'

function Settings() {
  const { theme, setTheme, THEMES } = useTheme()

  const themeOptions = [
    {
      id: THEMES.default,
      name: 'Default',
      description: 'Clean, modern light theme',
      preview: 'bg-white border-primary-200',
      icon: '☀️'
    },
    {
      id: THEMES.dark,
      name: 'Dark Mode',
      description: 'Easy on the eyes',
      preview: 'bg-gray-900 border-gray-700',
      icon: '🌙'
    },
    {
      id: THEMES.retro,
      name: '90s Internet',
      description: 'Blast from the past!',
      preview: 'bg-purple-600 border-yellow-400',
      icon: '💾'
    }
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 retro:text-yellow-300 retro:font-mono">
        Settings
      </h2>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Theme</h3>
        <div className="grid gap-4">
          {themeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setTheme(option.id)}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                theme === option.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl ${option.preview}`}
              >
                {option.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{option.name}</p>
                <p className="text-sm text-gray-500">{option.description}</p>
              </div>
              {theme === option.id && (
                <div className="text-primary-600 text-xl">✓</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {theme === 'retro' && (
        <div className="card p-6 bg-purple-100 border-4 border-dashed border-yellow-400">
          <p className="text-center font-mono text-purple-900">
            <span className="text-2xl">🚧</span> UNDER CONSTRUCTION <span className="text-2xl">🚧</span>
            <br />
            <span className="text-sm">Best viewed in Netscape Navigator 4.0</span>
          </p>
        </div>
      )}
    </div>
  )
}

export default Settings
