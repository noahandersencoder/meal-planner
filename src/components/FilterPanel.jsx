import useStore from '../store/useStore'

const timeOptions = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hr' },
  { value: 120, label: '1 hr+' },
]

const dietaryOptions = [
  { value: 'red-meat', label: 'Red Meat' },
  { value: 'poultry', label: 'Poultry' },
  { value: 'fish', label: 'Fish' },
  { value: 'dairy', label: 'Dairy' },
]

const budgetOptions = [
  { value: 1, label: '$' },
  { value: 2, label: '$$' },
  { value: 3, label: '$$$' },
]

const cuisineOptions = [
  { value: '', label: 'All Cuisines' },
  { value: 'italian', label: 'Italian' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'thai', label: 'Thai' },
  { value: 'indian', label: 'Indian' },
  { value: 'american', label: 'American' },
  { value: 'french', label: 'French' },
  { value: 'greek', label: 'Greek' },
  { value: 'korean', label: 'Korean' },
  { value: 'vietnamese', label: 'Vietnamese' },
  { value: 'middle-eastern', label: 'Middle Eastern' },
]

function FilterPanel({ filters, onChange, compact = false }) {
  const handleTimeChange = (value) => {
    onChange({ ...filters, maxCookTime: value })
  }

  const handleBudgetChange = (value) => {
    onChange({ ...filters, budgetLevel: value })
  }

  const handleDietaryToggle = (value) => {
    const current = filters.dietaryRestrictions || []
    const newRestrictions = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    onChange({ ...filters, dietaryRestrictions: newRestrictions })
  }

  const handleVeganToggle = () => {
    onChange({ ...filters, veganMode: !filters.veganMode })
  }

  const handleVegetarianToggle = () => {
    onChange({ ...filters, vegetarianMode: !filters.vegetarianMode })
  }

  const handleCuisineChange = (value) => {
    onChange({ ...filters, cuisine: value })
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 p-4 bg-white rounded-lg shadow-sm">
        <select
          value={filters.maxCookTime || 60}
          onChange={(e) => handleTimeChange(Number(e.target.value))}
          className="input py-1.5 text-sm w-auto"
        >
          {timeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              ≤ {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.budgetLevel || 2}
          onChange={(e) => handleBudgetChange(Number(e.target.value))}
          className="input py-1.5 text-sm w-auto"
        >
          {budgetOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} & below
            </option>
          ))}
        </select>

        <select
          value={filters.cuisine || ''}
          onChange={(e) => handleCuisineChange(e.target.value)}
          className="input py-1.5 text-sm w-auto"
        >
          {cuisineOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={handleVegetarianToggle}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filters.vegetarianMode
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Vegetarian
        </button>

        <button
          onClick={handleVeganToggle}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filters.veganMode
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Vegan
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm">
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Max Cooking Time</h3>
        <div className="flex flex-wrap gap-2">
          {timeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleTimeChange(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.maxCookTime === opt.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-3">Budget</h3>
        <div className="flex gap-2">
          {budgetOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleBudgetChange(opt.value)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.budgetLevel === opt.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-3">Diet Mode</h3>
        <div className="flex gap-2">
          <button
            onClick={handleVegetarianToggle}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.vegetarianMode
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Vegetarian
          </button>
          <button
            onClick={handleVeganToggle}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.veganMode
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Vegan
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-3">Cuisine</h3>
        <div className="flex flex-wrap gap-2">
          {cuisineOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleCuisineChange(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                (filters.cuisine || '') === opt.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-3">Exclude Ingredients</h3>
        <div className="flex flex-wrap gap-2">
          {dietaryOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleDietaryToggle(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                (filters.dietaryRestrictions || []).includes(opt.value)
                  ? 'bg-red-100 text-red-700 ring-2 ring-red-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              No {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FilterPanel
