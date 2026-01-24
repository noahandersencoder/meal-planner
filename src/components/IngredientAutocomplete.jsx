import { useState, useRef, useEffect } from 'react'
import ingredientsData from '../data/ingredients.json'

// Flatten all ingredients into a single searchable list
const allIngredients = Object.entries(ingredientsData).flatMap(([category, items]) =>
  items.map(item => ({ ...item, category }))
)

function IngredientAutocomplete({ value, onChange, onSelect, placeholder }) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  // Filter suggestions based on input
  useEffect(() => {
    if (!value || value.length < 1) {
      setSuggestions([])
      return
    }

    const query = value.toLowerCase()
    const filtered = allIngredients
      .filter(ing => ing.name.toLowerCase().includes(query))
      .slice(0, 8) // Limit to 8 suggestions

    setSuggestions(filtered)
    setHighlightedIndex(0)
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    onChange(e.target.value)
    setIsOpen(true)
  }

  const handleSelect = (ingredient) => {
    onSelect(ingredient)
    setIsOpen(false)
  }

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const getCategoryIcon = (category) => {
    const icons = {
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
      other: '📦'
    }
    return icons[category] || '📦'
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => value && setSuggestions.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="input"
        autoComplete="off"
      />

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((ingredient, index) => (
            <li
              key={`${ingredient.category}-${ingredient.name}`}
              onClick={() => handleSelect(ingredient)}
              className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                index === highlightedIndex
                  ? 'bg-primary-50 text-primary-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{getCategoryIcon(ingredient.category)}</span>
                <span className="font-medium">{ingredient.name}</span>
              </div>
              <span className="text-sm text-gray-500">
                ~${ingredient.avgCost.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default IngredientAutocomplete
