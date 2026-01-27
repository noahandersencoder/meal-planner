import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { updateUserProfile, getUserProfile, isFirebaseEnabled } from '../firebase'
import ImageCropper from '../components/ImageCropper'
import FilterPanel from '../components/FilterPanel'
import useStore from '../store/useStore'

function Settings() {
  const { theme, setTheme, THEMES } = useTheme()
  const { user } = useAuth()
  const { preferences, setPreferences } = useStore()
  const [displayName, setDisplayName] = useState('')
  const [photoURL, setPhotoURL] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [imageToCrop, setImageToCrop] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (user && isFirebaseEnabled()) {
      loadProfile()
    } else {
      setLoadingProfile(false)
    }
  }, [user])

  const loadProfile = async () => {
    try {
      const profile = await getUserProfile(user.uid)
      if (profile) {
        setDisplayName(profile.displayName || '')
        setPhotoURL(profile.photoURL || '')
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    }
    setLoadingProfile(false)
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    setSaveMessage('')
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        photoURL: photoURL.trim(),
        email: user.email
      })
      setSaveMessage('Profile saved!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
      setSaveMessage('Error saving profile')
    }
    setSaving(false)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImageToCrop(event.target.result)
      }
      reader.readAsDataURL(file)
      // Reset input so same file can be selected again
      e.target.value = ''
    }
  }

  const handleCropComplete = (croppedImage) => {
    setPhotoURL(croppedImage)
    setImageToCrop(null)
  }

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
      id: THEMES.techno,
      name: 'Techno',
      description: 'Futuristic neon vibes',
      preview: 'bg-black border-cyan-400',
      icon: '🔮'
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

      {/* Profile Section */}
      {user && isFirebaseEnabled() && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h3>

          {loadingProfile ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Profile Picture */}
              <div className="flex items-center gap-4">
                <div
                  className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-gray-400">
                      {displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition-all">
                    <span className="text-white opacity-0 hover:opacity-100">Edit</span>
                  </div>
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary text-sm"
                  >
                    Upload Photo
                  </button>
                  {photoURL && (
                    <button
                      onClick={() => setPhotoURL('')}
                      className="ml-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Click to upload a profile picture
                  </p>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This name will be shown on recipes you create
                </p>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="input bg-gray-50 text-gray-500"
                />
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
                {saveMessage && (
                  <span className={`text-sm ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                    {saveMessage}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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

      {theme === 'techno' && (
        <div className="card p-6 bg-black border-2 border-cyan-400">
          <p className="text-center text-cyan-400 font-mono">
            <span className="text-2xl">🎵</span> TECHNO MODE ACTIVATED <span className="text-2xl">🎵</span>
            <br />
            <span className="text-sm">Playing: "I Want to be a Machine"</span>
            <br />
            <span className="text-xs text-cyan-600 mt-2 block">Music opens in a new tab</span>
          </p>
        </div>
      )}

      {/* Cooking Preferences */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cooking Preferences</h3>
        <p className="text-sm text-gray-500 mb-4">
          These settings filter recipes when browsing
        </p>

        <FilterPanel filters={preferences} onChange={setPreferences} />

        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Servings per Meal</h4>
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                setPreferences({ servings: Math.max(1, preferences.servings - 1) })
              }
              className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors"
            >
              -
            </button>
            <span className="text-2xl font-bold text-gray-900 w-12 text-center">
              {preferences.servings}
            </span>
            <button
              onClick={() =>
                setPreferences({ servings: Math.min(12, preferences.servings + 1) })
              }
              className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors"
            >
              +
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Recipe costs will be adjusted based on serving size
          </p>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => setImageToCrop(null)}
          aspect={1}
          maxSize={200}
          quality={0.8}
        />
      )}
    </div>
  )
}

export default Settings
