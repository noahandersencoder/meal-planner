import { useState } from 'react'
import { getConversionFactor, getUnitType, GRAMS_PER_CUP } from '../utils/unitConversions'

// Available units grouped by type
const WEIGHT_UNITS = ['g', 'oz', 'lb', 'kg']
const VOLUME_UNITS = ['ml', 'tsp', 'tbsp', 'cup', 'cups', 'pint', 'can']
const COUNTABLE_UNITS = ['whole', 'cloves', 'stalks', 'sprigs', 'slices', 'bunch', 'head', 'packet']

function IngredientWithUnitSelect({ ingredient }) {
  const [selectedUnit, setSelectedUnit] = useState(ingredient.unit)
  const [convertedAmount, setConvertedAmount] = useState(ingredient.amount)

  // Check if ingredient has a known density for cross-type conversion
  const hasDensity = GRAMS_PER_CUP[ingredient.name] !== undefined

  // Get available units based on original unit type
  const getAvailableUnits = () => {
    const originalType = getUnitType(ingredient.unit)

    if (originalType === 'weight') {
      // If ingredient has known density, allow volume conversions too
      if (hasDensity) {
        return [...WEIGHT_UNITS, 'cup', 'tbsp', 'tsp']
      }
      return WEIGHT_UNITS
    } else if (originalType === 'volume') {
      // If ingredient has known density, allow weight conversions too
      if (hasDensity) {
        return [...VOLUME_UNITS, 'g', 'oz']
      }
      return VOLUME_UNITS
    } else if (originalType === 'countable') {
      return COUNTABLE_UNITS
    }
    // For unknown units, just return the original
    return [ingredient.unit]
  }

  const handleUnitChange = (newUnit) => {
    const factor = getConversionFactor(ingredient.unit, newUnit, ingredient.name)

    if (factor !== null) {
      const newAmount = ingredient.amount * factor
      setConvertedAmount(newAmount)
      setSelectedUnit(newUnit)
    } else {
      // Can't convert, reset to original
      setConvertedAmount(ingredient.amount)
      setSelectedUnit(ingredient.unit)
    }
  }

  const formatAmount = (amount) => {
    // Round to reasonable precision
    if (amount >= 100) {
      return Math.round(amount)
    } else if (amount >= 10) {
      return Math.round(amount * 10) / 10
    } else if (amount >= 1) {
      return Math.round(amount * 100) / 100
    } else {
      return Math.round(amount * 1000) / 1000
    }
  }

  const availableUnits = getAvailableUnits()
  const showDropdown = availableUnits.length > 1

  return (
    <li className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 flex-1">
        <span className="text-gray-800 font-medium">
          {formatAmount(convertedAmount)}
        </span>
        {showDropdown ? (
          <select
            value={selectedUnit}
            onChange={(e) => handleUnitChange(e.target.value)}
            className="text-gray-600 bg-gray-100 border-0 rounded px-2 py-0.5 text-sm cursor-pointer hover:bg-gray-200 transition-colors"
          >
            {availableUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-gray-600">{selectedUnit}</span>
        )}
        <span className="text-gray-800">{ingredient.name}</span>
      </div>
      <span className="text-gray-500 text-sm">${(ingredient.cost || 0).toFixed(2)}</span>
    </li>
  )
}

export default IngredientWithUnitSelect
