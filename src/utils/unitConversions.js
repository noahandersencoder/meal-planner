// Unit conversion utilities for ingredient costs

// Weight units in grams
const WEIGHT_TO_GRAMS = {
  g: 1,
  oz: 28.35,
  lb: 453.6,
  kg: 1000,
}

// Volume units in ml
const VOLUME_TO_ML = {
  ml: 1,
  tsp: 4.93,
  tbsp: 14.79,
  cup: 236.59,
  cups: 236.59,
  pint: 473.18,
  can: 400, // approximate for standard can
}

// Countable units (no conversion between these and weight/volume)
const COUNTABLE_UNITS = ['whole', 'cloves', 'stalks', 'sprigs', 'slices', 'bunch', 'head', 'packet']

// Grams per cup for common ingredients (for volume ↔ weight conversion)
// This allows converting between cups and oz/lb for specific ingredients
const GRAMS_PER_CUP = {
  // Flours & Grains
  'All-Purpose Flour': 125,
  'Bread Crumbs': 108,
  'Panko Bread Crumbs': 60,
  'Rice (White)': 185,
  'Jasmine Rice': 185,
  'Arborio Rice': 200,
  'Quinoa': 170,
  'Couscous': 157,
  'Sugar': 200,
  'Brown Sugar': 220,

  // Dairy
  'Butter': 227,
  'Milk': 245,
  'Heavy Cream': 238,
  'Sour Cream': 230,
  'Greek Yogurt': 245,
  'Yogurt': 245,
  'Cheddar Cheese': 113,
  'Mozzarella Cheese': 113,
  'Parmesan Cheese': 100,
  'Ricotta Cheese': 246,
  'Cottage Cheese': 225,

  // Liquids
  'Olive Oil': 216,
  'Vegetable Oil': 218,
  'Coconut Milk': 226,
  'Chicken Broth': 240,
  'Beef Broth': 240,
  'Vegetable Broth': 240,
  'Soy Sauce': 255,
  'Honey': 340,
  'Maple Syrup': 312,

  // Produce (chopped/diced)
  'Spinach': 30,
  'Broccoli': 91,
  'Carrot': 128,
  'Onion': 160,
  'Tomato': 180,
  'Bell Pepper': 150,
  'Mushrooms': 70,
  'Celery': 101,
  'Cabbage': 89,

  // Nuts
  'Almonds': 143,
  'Walnuts': 120,
  'Peanuts': 146,
  'Cashews': 137,

  // Default for unknown ingredients (approximate)
  '_default': 150,
}

/**
 * Get the unit type: 'weight', 'volume', or 'countable'
 */
export function getUnitType(unit) {
  if (WEIGHT_TO_GRAMS[unit]) return 'weight'
  if (VOLUME_TO_ML[unit]) return 'volume'
  if (COUNTABLE_UNITS.includes(unit)) return 'countable'
  return 'unknown'
}

/**
 * Convert between units of the same type
 * Returns the conversion factor (multiply old amount by this to get new amount)
 */
export function getConversionFactor(fromUnit, toUnit, ingredientName = null) {
  const fromType = getUnitType(fromUnit)
  const toType = getUnitType(toUnit)

  // Same unit, no conversion needed
  if (fromUnit === toUnit) return 1

  // Weight to weight
  if (fromType === 'weight' && toType === 'weight') {
    const fromGrams = WEIGHT_TO_GRAMS[fromUnit]
    const toGrams = WEIGHT_TO_GRAMS[toUnit]
    return fromGrams / toGrams
  }

  // Volume to volume
  if (fromType === 'volume' && toType === 'volume') {
    const fromMl = VOLUME_TO_ML[fromUnit]
    const toMl = VOLUME_TO_ML[toUnit]
    return fromMl / toMl
  }

  // Volume to weight (need ingredient density)
  if (fromType === 'volume' && toType === 'weight' && ingredientName) {
    const gramsPerCup = GRAMS_PER_CUP[ingredientName] || GRAMS_PER_CUP['_default']
    const fromMl = VOLUME_TO_ML[fromUnit]
    const toGrams = WEIGHT_TO_GRAMS[toUnit]

    // Convert volume to ml, then to cups, then to grams, then to target unit
    const mlPerCup = VOLUME_TO_ML['cup']
    const volumeInCups = fromMl / mlPerCup
    const volumeInGrams = volumeInCups * gramsPerCup
    return volumeInGrams / toGrams
  }

  // Weight to volume (need ingredient density)
  if (fromType === 'weight' && toType === 'volume' && ingredientName) {
    const gramsPerCup = GRAMS_PER_CUP[ingredientName] || GRAMS_PER_CUP['_default']
    const fromGrams = WEIGHT_TO_GRAMS[fromUnit]
    const toMl = VOLUME_TO_ML[toUnit]

    // Convert weight to grams, then to cups, then to ml, then to target unit
    const mlPerCup = VOLUME_TO_ML['cup']
    const weightInCups = fromGrams / gramsPerCup
    const weightInMl = weightInCups * mlPerCup
    return weightInMl / toMl
  }

  // Countable units or incompatible types - no conversion
  return null
}

/**
 * Calculate new cost when changing units
 * @param {number} currentCost - Current total cost
 * @param {number} currentAmount - Current amount
 * @param {string} currentUnit - Current unit
 * @param {string} newUnit - New unit to convert to
 * @param {string} ingredientName - Name of ingredient (for density lookup)
 * @returns {number|null} - New cost, or null if conversion not possible
 */
export function convertCostForUnit(currentCost, currentAmount, currentUnit, newUnit, ingredientName) {
  if (!currentCost || !currentAmount || currentUnit === newUnit) {
    return currentCost
  }

  const factor = getConversionFactor(currentUnit, newUnit, ingredientName)

  if (factor === null) {
    // Can't convert - return null to indicate no auto-conversion
    return null
  }

  // Cost per unit stays the same conceptually - we're just expressing it in different units
  // If 1 lb costs $5, and we convert to oz, we still have the same total value
  // The new amount will be currentAmount * factor
  // So cost stays the same (total cost for the ingredient)
  return currentCost
}

/**
 * Calculate the cost per unit in the new unit system
 */
export function getCostPerUnitConverted(costPerUnit, fromUnit, toUnit, ingredientName) {
  if (!costPerUnit || fromUnit === toUnit) {
    return costPerUnit
  }

  const factor = getConversionFactor(fromUnit, toUnit, ingredientName)

  if (factor === null) {
    return null
  }

  // If $5 per lb, and 1 lb = 16 oz, then cost per oz = $5 / 16 = $0.3125
  // factor is how many of new unit = 1 old unit
  // So cost per new unit = costPerUnit / factor
  return costPerUnit / factor
}

export { WEIGHT_TO_GRAMS, VOLUME_TO_ML, COUNTABLE_UNITS, GRAMS_PER_CUP }
