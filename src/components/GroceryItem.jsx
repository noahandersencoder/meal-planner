import { useState } from 'react'

const categoryIcons = {
  produce: '🥬',
  meat: '🥩',
  seafood: '🐟',
  dairy: '🧀',
  pantry: '🥫',
  spices: '🧂',
  baking: '🧁',
  frozen: '🧊',
  snacks: '🍿',
  breakfast: '🥣',
  drinks: '🥤',
  other: '📦',
}

function GroceryItem({ item, checked, onToggle, onRemove, showCategory = false }) {
  const [showTooltip, setShowTooltip] = useState(false)

  const handleRemove = (e) => {
    e.stopPropagation()
    onRemove?.()
  }

  const usedIn = item.usedIn || []

  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className={`relative flex items-center p-3 rounded-lg cursor-pointer transition-all group ${
        checked
          ? 'bg-gray-100 opacity-60'
          : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${
          checked
            ? 'bg-primary-600 border-primary-600'
            : 'border-gray-300'
        }`}
      >
        {checked && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {showCategory && (
        <span className="mr-2 text-lg" title={item.category}>
          {categoryIcons[item.category] || '📦'}
        </span>
      )}

      <div className="flex-1">
        <span className={`font-medium ${checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {item.name}
        </span>
        <span className="text-gray-500 ml-2">
          {item.amount} {item.unit}
        </span>
      </div>

      <span className="text-sm text-gray-400 mr-2">
        ${(item.cost || 0).toFixed(2)}
      </span>

      {onRemove && (
        <button
          onClick={handleRemove}
          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1"
          title="Remove item"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Recipe source tooltip */}
      {showTooltip && usedIn.length > 0 && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap pointer-events-none">
          <p className="font-semibold mb-1">Used in:</p>
          {usedIn.map((name, i) => (
            <p key={i}>{name}</p>
          ))}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroceryItem
