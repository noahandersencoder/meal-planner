import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import FilterPanel from '../components/FilterPanel'

function Preferences() {
  const navigate = useNavigate()
  const { preferences, setPreferences } = useStore()

  const handleSave = () => {
    navigate('/browse')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Your Preferences</h2>
        <p className="text-gray-600 mt-1">
          Customize your recipe recommendations
        </p>
      </div>

      <FilterPanel filters={preferences} onChange={setPreferences} />

      <div>
        <h3 className="font-medium text-gray-900 mb-3">Servings per Meal</h3>
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

      <button onClick={handleSave} className="btn btn-primary w-full">
        Browse Recipes
      </button>
    </div>
  )
}

export default Preferences
