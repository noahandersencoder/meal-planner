import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// Standard ingredients database - AI must use these exact names, units, and costs
const STANDARD_INGREDIENTS = {
  produce: [
    { name: "Asparagus", unit: "bunch", cost: 3.50 },
    { name: "Avocado", unit: "whole", cost: 2.00 },
    { name: "Banana", unit: "whole", cost: 0.25 },
    { name: "Basil (Fresh)", unit: "cup", cost: 1.75 },
    { name: "Bean Sprouts", unit: "cup", cost: 1.25 },
    { name: "Bell Pepper", unit: "whole", cost: 1.50 },
    { name: "Blueberries", unit: "cup", cost: 3.50 },
    { name: "Broccoli", unit: "cups", cost: 2.50 },
    { name: "Butter Lettuce", unit: "head", cost: 2.50 },
    { name: "Butternut Squash", unit: "lb", cost: 3.50 },
    { name: "Cabbage", unit: "head", cost: 2.00 },
    { name: "Carrot", unit: "whole", cost: 0.30 },
    { name: "Cauliflower", unit: "head", cost: 3.00 },
    { name: "Celery", unit: "stalks", cost: 0.50 },
    { name: "Cherry Tomatoes", unit: "pint", cost: 3.00 },
    { name: "Cilantro", unit: "bunch", cost: 1.00 },
    { name: "Corn on the Cob", unit: "whole", cost: 0.75 },
    { name: "Cucumber", unit: "whole", cost: 1.00 },
    { name: "Dill (Fresh)", unit: "bunch", cost: 1.50 },
    { name: "Eggplant", unit: "whole", cost: 2.50 },
    { name: "Garlic", unit: "cloves", cost: 0.15 },
    { name: "Ginger", unit: "tbsp", cost: 0.40 },
    { name: "Green Beans", unit: "lb", cost: 3.00 },
    { name: "Green Onion", unit: "bunch", cost: 1.00 },
    { name: "Jalapeño", unit: "whole", cost: 0.25 },
    { name: "Kale", unit: "bunch", cost: 2.50 },
    { name: "Lemon", unit: "whole", cost: 0.75 },
    { name: "Lemongrass", unit: "stalks", cost: 2.00 },
    { name: "Lettuce (Romaine)", unit: "head", cost: 2.50 },
    { name: "Lime", unit: "whole", cost: 0.50 },
    { name: "Mango", unit: "whole", cost: 2.00 },
    { name: "Mint (Fresh)", unit: "bunch", cost: 1.50 },
    { name: "Mushrooms", unit: "oz", cost: 3.00 },
    { name: "Onion", unit: "whole", cost: 0.75 },
    { name: "Orange", unit: "whole", cost: 0.75 },
    { name: "Parsley (Fresh)", unit: "bunch", cost: 1.25 },
    { name: "Potato", unit: "lb", cost: 1.50 },
    { name: "Red Onion", unit: "whole", cost: 0.75 },
    { name: "Rosemary (Fresh)", unit: "sprigs", cost: 1.50 },
    { name: "Shallot", unit: "whole", cost: 0.75 },
    { name: "Snap Peas", unit: "cup", cost: 2.50 },
    { name: "Spinach", unit: "cups", cost: 2.50 },
    { name: "Strawberries", unit: "cup", cost: 3.00 },
    { name: "Sweet Potato", unit: "whole", cost: 1.50 },
    { name: "Thai Chili", unit: "whole", cost: 0.25 },
    { name: "Thyme (Fresh)", unit: "sprigs", cost: 1.50 },
    { name: "Tomato", unit: "whole", cost: 0.75 },
    { name: "Zucchini", unit: "whole", cost: 1.50 }
  ],
  meat: [
    { name: "Bacon", unit: "lb", cost: 7.00 },
    { name: "Beef Chuck", unit: "lb", cost: 8.00 },
    { name: "Beef Short Ribs", unit: "lb", cost: 10.00 },
    { name: "Brisket", unit: "lb", cost: 9.00 },
    { name: "Chicken Breast", unit: "lb", cost: 5.00 },
    { name: "Chicken Drumsticks", unit: "lb", cost: 3.00 },
    { name: "Chicken Thighs", unit: "lb", cost: 4.00 },
    { name: "Chicken Wings", unit: "lb", cost: 4.50 },
    { name: "Flank Steak", unit: "lb", cost: 12.00 },
    { name: "Ground Beef", unit: "lb", cost: 6.00 },
    { name: "Ground Chicken", unit: "lb", cost: 5.50 },
    { name: "Ground Lamb", unit: "lb", cost: 10.00 },
    { name: "Ground Pork", unit: "lb", cost: 5.00 },
    { name: "Ground Turkey", unit: "lb", cost: 5.50 },
    { name: "Ham", unit: "lb", cost: 6.00 },
    { name: "Italian Sausage", unit: "lb", cost: 5.00 },
    { name: "Lamb Chops", unit: "lb", cost: 14.00 },
    { name: "Pork Belly", unit: "lb", cost: 6.00 },
    { name: "Pork Chops", unit: "lb", cost: 5.00 },
    { name: "Pork Shoulder", unit: "lb", cost: 4.00 },
    { name: "Pork Tenderloin", unit: "lb", cost: 7.00 },
    { name: "Prosciutto", unit: "oz", cost: 2.50 },
    { name: "Ribeye Steak", unit: "lb", cost: 15.00 },
    { name: "Sirloin Steak", unit: "lb", cost: 10.00 },
    { name: "Turkey Breast", unit: "lb", cost: 6.00 },
    { name: "Whole Chicken", unit: "whole", cost: 10.00 }
  ],
  seafood: [
    { name: "Cod Fillet", unit: "lb", cost: 10.00 },
    { name: "Crab Meat", unit: "oz", cost: 8.00 },
    { name: "Halibut", unit: "lb", cost: 20.00 },
    { name: "Mahi Mahi", unit: "lb", cost: 14.00 },
    { name: "Mussels", unit: "lb", cost: 6.00 },
    { name: "Salmon Fillet", unit: "lb", cost: 12.00 },
    { name: "Scallops", unit: "lb", cost: 18.00 },
    { name: "Shrimp", unit: "lb", cost: 10.00 },
    { name: "Tilapia Fillet", unit: "lb", cost: 7.00 },
    { name: "Tuna (canned)", unit: "can", cost: 2.00 },
    { name: "Tuna Steak", unit: "lb", cost: 15.00 }
  ],
  dairy: [
    { name: "Butter", unit: "tbsp", cost: 0.25 },
    { name: "Buttermilk", unit: "cup", cost: 0.75 },
    { name: "Cheddar Cheese", unit: "cup", cost: 3.00 },
    { name: "Cream Cheese", unit: "oz", cost: 2.00 },
    { name: "Egg", unit: "whole", cost: 0.35 },
    { name: "Feta Cheese", unit: "oz", cost: 3.00 },
    { name: "Goat Cheese", unit: "oz", cost: 4.00 },
    { name: "Greek Yogurt", unit: "cup", cost: 2.00 },
    { name: "Gruyere Cheese", unit: "oz", cost: 2.50 },
    { name: "Half and Half", unit: "cup", cost: 1.00 },
    { name: "Heavy Cream", unit: "cup", cost: 2.50 },
    { name: "Milk", unit: "cup", cost: 0.50 },
    { name: "Mozzarella Cheese", unit: "cup", cost: 3.00 },
    { name: "Parmesan Cheese", unit: "cup", cost: 4.00 },
    { name: "Ricotta Cheese", unit: "cup", cost: 3.50 },
    { name: "Sour Cream", unit: "cup", cost: 2.00 }
  ],
  pantry: [
    { name: "All-Purpose Flour", unit: "cup", cost: 0.25 },
    { name: "Arborio Rice", unit: "cup", cost: 2.00 },
    { name: "Balsamic Vinegar", unit: "tbsp", cost: 0.50 },
    { name: "BBQ Sauce", unit: "cup", cost: 2.00 },
    { name: "Beef Broth", unit: "cups", cost: 2.00 },
    { name: "Black Beans (canned)", unit: "can", cost: 1.25 },
    { name: "Bread Crumbs", unit: "cup", cost: 1.00 },
    { name: "Brown Rice", unit: "cup", cost: 1.00 },
    { name: "Brown Sugar", unit: "cup", cost: 1.00 },
    { name: "Chicken Broth", unit: "cups", cost: 2.00 },
    { name: "Chickpeas (canned)", unit: "can", cost: 1.50 },
    { name: "Coconut Milk", unit: "can", cost: 2.50 },
    { name: "Corn Tortillas", unit: "whole", cost: 0.20 },
    { name: "Cornstarch", unit: "tbsp", cost: 0.10 },
    { name: "Crushed Tomatoes (canned)", unit: "oz", cost: 2.00 },
    { name: "Diced Tomatoes (canned)", unit: "oz", cost: 1.50 },
    { name: "Dijon Mustard", unit: "tbsp", cost: 0.50 },
    { name: "Fish Sauce", unit: "tbsp", cost: 0.50 },
    { name: "Flour Tortillas", unit: "whole", cost: 0.30 },
    { name: "Hoisin Sauce", unit: "tbsp", cost: 0.50 },
    { name: "Honey", unit: "tbsp", cost: 0.50 },
    { name: "Jasmine Rice", unit: "cup", cost: 1.00 },
    { name: "Ketchup", unit: "tbsp", cost: 0.10 },
    { name: "Kidney Beans (canned)", unit: "can", cost: 1.25 },
    { name: "Maple Syrup", unit: "tbsp", cost: 0.75 },
    { name: "Marinara Sauce", unit: "oz", cost: 3.00 },
    { name: "Mayonnaise", unit: "tbsp", cost: 0.25 },
    { name: "Oats (Rolled)", unit: "cup", cost: 0.50 },
    { name: "Olive Oil", unit: "tbsp", cost: 0.30 },
    { name: "Oyster Sauce", unit: "tbsp", cost: 0.50 },
    { name: "Panko Bread Crumbs", unit: "cup", cost: 1.50 },
    { name: "Pasta (any shape)", unit: "lb", cost: 1.50 },
    { name: "Peanut Butter", unit: "tbsp", cost: 0.25 },
    { name: "Penne Pasta", unit: "lb", cost: 1.75 },
    { name: "Quinoa", unit: "cup", cost: 2.50 },
    { name: "Red Curry Paste", unit: "tbsp", cost: 0.75 },
    { name: "Rice (White)", unit: "cup", cost: 0.75 },
    { name: "Rice Noodles", unit: "oz", cost: 2.00 },
    { name: "Rice Vinegar", unit: "tbsp", cost: 0.20 },
    { name: "Sesame Oil", unit: "tbsp", cost: 0.50 },
    { name: "Soy Sauce", unit: "tbsp", cost: 0.25 },
    { name: "Spaghetti", unit: "lb", cost: 1.75 },
    { name: "Sriracha", unit: "tbsp", cost: 0.30 },
    { name: "Sugar", unit: "cup", cost: 0.50 },
    { name: "Tahini", unit: "tbsp", cost: 0.75 },
    { name: "Teriyaki Sauce", unit: "tbsp", cost: 0.40 },
    { name: "Tomato Paste", unit: "tbsp", cost: 0.50 },
    { name: "Vegetable Broth", unit: "cups", cost: 1.75 },
    { name: "Vegetable Oil", unit: "tbsp", cost: 0.10 },
    { name: "White Wine", unit: "cup", cost: 2.00 },
    { name: "Worcestershire Sauce", unit: "tbsp", cost: 0.25 }
  ],
  spices: [
    { name: "Bay Leaves", unit: "whole", cost: 0.10 },
    { name: "Black Pepper", unit: "tsp", cost: 0.10 },
    { name: "Cayenne Pepper", unit: "tsp", cost: 0.15 },
    { name: "Chili Flakes", unit: "tsp", cost: 0.15 },
    { name: "Chili Powder", unit: "tsp", cost: 0.15 },
    { name: "Cinnamon (Ground)", unit: "tsp", cost: 0.15 },
    { name: "Coriander (Ground)", unit: "tsp", cost: 0.15 },
    { name: "Cumin (Ground)", unit: "tsp", cost: 0.15 },
    { name: "Curry Powder", unit: "tbsp", cost: 0.40 },
    { name: "Dried Basil", unit: "tsp", cost: 0.10 },
    { name: "Dried Oregano", unit: "tsp", cost: 0.10 },
    { name: "Dried Thyme", unit: "tsp", cost: 0.10 },
    { name: "Garam Masala", unit: "tbsp", cost: 0.50 },
    { name: "Garlic Powder", unit: "tsp", cost: 0.15 },
    { name: "Ginger (Ground)", unit: "tsp", cost: 0.20 },
    { name: "Italian Seasoning", unit: "tbsp", cost: 0.25 },
    { name: "Nutmeg (Ground)", unit: "tsp", cost: 0.25 },
    { name: "Onion Powder", unit: "tsp", cost: 0.15 },
    { name: "Paprika", unit: "tsp", cost: 0.15 },
    { name: "Red Pepper Flakes", unit: "tsp", cost: 0.10 },
    { name: "Salt", unit: "tsp", cost: 0.05 },
    { name: "Smoked Paprika", unit: "tsp", cost: 0.20 },
    { name: "Turmeric", unit: "tsp", cost: 0.20 }
  ],
  baking: [
    { name: "Baking Powder", unit: "tsp", cost: 0.10 },
    { name: "Baking Soda", unit: "tsp", cost: 0.05 },
    { name: "Chocolate Chips (Semi-Sweet)", unit: "cup", cost: 3.00 },
    { name: "Cocoa Powder (Unsweetened)", unit: "cup", cost: 2.00 },
    { name: "Coconut (Shredded)", unit: "cup", cost: 2.00 },
    { name: "Lemon Zest", unit: "tbsp", cost: 0.25 },
    { name: "Orange Zest", unit: "tbsp", cost: 0.25 },
    { name: "Pecans", unit: "cup", cost: 5.00 },
    { name: "Powdered Sugar", unit: "cup", cost: 0.75 },
    { name: "Sliced Almonds", unit: "cup", cost: 4.00 },
    { name: "Vanilla Extract", unit: "tsp", cost: 0.75 },
    { name: "Walnuts", unit: "cup", cost: 4.00 }
  ],
  frozen: [
    { name: "Corn (Frozen)", unit: "cup", cost: 1.00 },
    { name: "Edamame (Frozen)", unit: "cup", cost: 2.00 },
    { name: "Mixed Vegetables (Frozen)", unit: "cup", cost: 1.50 },
    { name: "Peas (Frozen)", unit: "cup", cost: 1.25 },
    { name: "Spinach (Frozen)", unit: "cup", cost: 1.50 }
  ],
  other: [
    { name: "Almonds", unit: "cup", cost: 4.00 },
    { name: "Cashews", unit: "cup", cost: 5.00 },
    { name: "Chia Seeds", unit: "tbsp", cost: 0.50 },
    { name: "Coconut Flakes", unit: "cup", cost: 2.00 },
    { name: "Pine Nuts", unit: "oz", cost: 4.00 },
    { name: "Tofu", unit: "oz", cost: 3.00 }
  ]
};

// Create a flat lookup map for ingredient matching
function createIngredientLookup() {
  const lookup = {};
  const aliases = {};

  for (const [category, ingredients] of Object.entries(STANDARD_INGREDIENTS)) {
    for (const ing of ingredients) {
      const key = ing.name.toLowerCase();
      lookup[key] = { ...ing, category };

      // Create common aliases
      const words = key.split(/[\s()]+/).filter(w => w.length > 2);
      words.forEach(word => {
        if (!aliases[word]) aliases[word] = [];
        aliases[word].push({ ...ing, category });
      });
    }
  }

  return { lookup, aliases };
}

const { lookup: INGREDIENT_LOOKUP, aliases: INGREDIENT_ALIASES } = createIngredientLookup();

// Improved fuzzy ingredient matcher
function findBestIngredientMatch(ingredientName) {
  const searchTerm = ingredientName.toLowerCase().trim();

  // 1. Exact match
  if (INGREDIENT_LOOKUP[searchTerm]) {
    return INGREDIENT_LOOKUP[searchTerm];
  }

  // 2. Check if input contains a known ingredient name
  for (const [name, ing] of Object.entries(INGREDIENT_LOOKUP)) {
    if (searchTerm.includes(name) || name.includes(searchTerm)) {
      return ing;
    }
  }

  // 3. Check word-based aliases
  const words = searchTerm.split(/[\s,]+/).filter(w => w.length > 2);
  for (const word of words) {
    // Direct word match
    if (INGREDIENT_ALIASES[word] && INGREDIENT_ALIASES[word].length > 0) {
      return INGREDIENT_ALIASES[word][0];
    }

    // Singular/plural handling
    const singular = word.endsWith('s') ? word.slice(0, -1) : word;
    const plural = word + 's';

    if (INGREDIENT_ALIASES[singular] && INGREDIENT_ALIASES[singular].length > 0) {
      return INGREDIENT_ALIASES[singular][0];
    }
    if (INGREDIENT_ALIASES[plural] && INGREDIENT_ALIASES[plural].length > 0) {
      return INGREDIENT_ALIASES[plural][0];
    }
  }

  // 4. Common ingredient mappings
  const commonMappings = {
    'chicken': 'chicken breast',
    'beef': 'ground beef',
    'pork': 'ground pork',
    'fish': 'tilapia fillet',
    'white fish': 'tilapia fillet',
    'steak': 'sirloin steak',
    'rice': 'rice (white)',
    'white rice': 'rice (white)',
    'pasta': 'pasta (any shape)',
    'noodles': 'pasta (any shape)',
    'cheese': 'cheddar cheese',
    'oil': 'olive oil',
    'cooking oil': 'vegetable oil',
    'stock': 'chicken broth',
    'broth': 'chicken broth',
    'cream': 'heavy cream',
    'yogurt': 'greek yogurt',
    'lettuce': 'lettuce (romaine)',
    'tomatoes': 'tomato',
    'potatoes': 'potato',
    'onions': 'onion',
    'carrots': 'carrot',
    'peppers': 'bell pepper',
    'mushroom': 'mushrooms',
    'garlic cloves': 'garlic',
    'cloves garlic': 'garlic',
    'fresh ginger': 'ginger',
    'ginger root': 'ginger',
    'soy': 'soy sauce',
    'sesame': 'sesame oil',
    'vinegar': 'rice vinegar',
    'sugar': 'sugar',
    'salt': 'salt',
    'pepper': 'black pepper',
    'flour': 'all-purpose flour',
    'eggs': 'egg',
    'butter': 'butter',
    'milk': 'milk',
    'honey': 'honey',
    'lemon juice': 'lemon',
    'lime juice': 'lime',
    'orange juice': 'orange',
    'scallions': 'green onion',
    'spring onions': 'green onion',
    'coriander': 'cilantro',
    'capsicum': 'bell pepper',
    'aubergine': 'eggplant',
    'courgette': 'zucchini',
    'prawns': 'shrimp',
    'mince': 'ground beef',
    'minced beef': 'ground beef',
    'minced chicken': 'ground chicken',
    'minced pork': 'ground pork',
    'minced turkey': 'ground turkey'
  };

  for (const [alias, standard] of Object.entries(commonMappings)) {
    if (searchTerm.includes(alias) || alias.includes(searchTerm)) {
      if (INGREDIENT_LOOKUP[standard]) {
        return INGREDIENT_LOOKUP[standard];
      }
    }
  }

  return null;
}

// Format ingredients list for the prompt
function formatIngredientsForPrompt() {
  let output = '';
  for (const [category, ingredients] of Object.entries(STANDARD_INGREDIENTS)) {
    output += `\n${category.toUpperCase()}:\n`;
    output += ingredients.map(i => `- ${i.name} (${i.unit}, $${i.cost.toFixed(2)})`).join('\n');
  }
  return output;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredients, preferences } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'Ingredients array is required' });
    }

    const dietaryStr = preferences?.dietary?.length > 0
      ? `Dietary requirements: ${preferences.dietary.join(', ')}.`
      : '';

    const cuisineStr = preferences?.cuisine
      ? `Preferred cuisine style: ${preferences.cuisine}.`
      : '';

    const ingredientsList = formatIngredientsForPrompt();

    const prompt = `You are a recipe generation assistant. Create a recipe using these ingredients: ${ingredients.join(', ')}.

${dietaryStr}
${cuisineStr}

**CRITICAL REQUIREMENT**: You MUST use ingredient names EXACTLY as they appear in this database (case-sensitive, with parentheses where shown):
${ingredientsList}

**MAPPING RULES** - Convert user ingredients to EXACT database names:
- "chicken" → "Chicken Breast" or "Chicken Thighs"
- "beef" → "Ground Beef" or "Sirloin Steak"
- "rice" → "Rice (White)" or "Jasmine Rice" or "Brown Rice"
- "pasta" → "Pasta (any shape)" or "Spaghetti" or "Penne Pasta"
- "onion/onions" → "Onion"
- "garlic/garlic cloves" → "Garlic"
- "tomatoes" → "Tomato" or "Cherry Tomatoes" or "Diced Tomatoes (canned)"
- "oil" → "Olive Oil" or "Vegetable Oil" or "Sesame Oil"
- "cheese" → "Cheddar Cheese", "Mozzarella Cheese", "Parmesan Cheese", etc.
- "broth/stock" → "Chicken Broth" or "Beef Broth" or "Vegetable Broth"

Generate JSON in this EXACT format:

{
  "name": "Recipe Name",
  "description": "Brief 1-2 sentence description",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "difficulty": "easy",
  "costLevel": 2,
  "tags": ["tag1", "tag2"],
  "ingredients": [
    {
      "name": "Chicken Breast",
      "amount": 1.5,
      "unit": "lb",
      "cost": 7.50,
      "category": "meat"
    },
    {
      "name": "Olive Oil",
      "amount": 2,
      "unit": "tbsp",
      "cost": 0.60,
      "category": "pantry"
    }
  ],
  "instructions": [
    "Step 1 with clear instruction",
    "Step 2 with clear instruction"
  ]
}

**STRICT RULES**:
1. Ingredient "name" MUST match EXACTLY from the database (including capitalization and parentheses)
2. Use the "unit" shown for that ingredient in the database
3. cost = database per-unit cost × amount
4. category MUST match the database category for that ingredient
5. difficulty: "easy", "medium", or "hard"
6. costLevel: 1 ($), 2 ($$), or 3 ($$$) based on total cost
7. tags: use from [vegetarian, vegan, dairy-free, gluten-free, red-meat, poultry, fish, quick, italian, mexican, chinese, japanese, thai, indian, american, mediterranean, french, greek, korean, vietnamese, middle-eastern]
8. Add "quick" tag if total time ≤ 30 minutes
9. Add appropriate cuisine tag if applicable

Return ONLY the JSON object. No markdown formatting, no code blocks, no extra text.`;


    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    let responseText = message.content[0].text;

    // Clean up the response - remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    let recipe;
    try {
      recipe = JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from the response if it has extra text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          recipe = JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error(`Failed to parse recipe JSON: ${parseError.message}`);
        }
      } else {
        throw new Error(`Failed to parse recipe JSON: ${parseError.message}`);
      }
    }

    // Validate required fields
    const requiredFields = ['name', 'description', 'prepTime', 'cookTime', 'servings', 'difficulty', 'ingredients', 'instructions'];
    for (const field of requiredFields) {
      if (!recipe[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate and fix ingredients to match standard database using improved fuzzy matching
    recipe.ingredients = recipe.ingredients.map(ing => {
      // First try exact lookup
      const lookupKey = ing.name.toLowerCase();
      const standardIng = INGREDIENT_LOOKUP[lookupKey];

      if (standardIng) {
        // Exact match found - use standard values
        return {
          name: standardIng.name,
          amount: parseFloat(ing.amount) || 1,
          unit: standardIng.unit,
          cost: Math.round((standardIng.cost * (parseFloat(ing.amount) || 1)) * 100) / 100,
          category: standardIng.category
        };
      }

      // Try fuzzy matching
      const fuzzyMatch = findBestIngredientMatch(ing.name);
      if (fuzzyMatch) {
        return {
          name: fuzzyMatch.name,
          amount: parseFloat(ing.amount) || 1,
          unit: fuzzyMatch.unit,
          cost: Math.round((fuzzyMatch.cost * (parseFloat(ing.amount) || 1)) * 100) / 100,
          category: fuzzyMatch.category
        };
      }

      // No match found - log warning and keep original with valid defaults
      console.warn(`No standard ingredient match found for: "${ing.name}"`);
      const validCategories = ['produce', 'meat', 'seafood', 'dairy', 'pantry', 'spices', 'baking', 'frozen', 'other'];
      return {
        name: ing.name,
        amount: parseFloat(ing.amount) || 1,
        unit: ing.unit || 'whole',
        cost: parseFloat(ing.cost) || 1.00,
        category: validCategories.includes(ing.category) ? ing.category : 'other'
      };
    });

    // Calculate total cost and set costLevel
    const totalCost = recipe.ingredients.reduce((sum, ing) => sum + (ing.cost || 0), 0);
    if (totalCost < 10) recipe.costLevel = 1;
    else if (totalCost < 20) recipe.costLevel = 2;
    else recipe.costLevel = 3;

    // Ensure tags is an array
    if (!Array.isArray(recipe.tags)) {
      recipe.tags = [];
    }

    // Add quick tag if applicable
    const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
    if (totalTime <= 30 && !recipe.tags.includes('quick')) {
      recipe.tags.push('quick');
    }

    return res.status(200).json({ recipe });
  } catch (error) {
    console.error('Error generating recipe:', error);
    return res.status(500).json({
      error: 'Failed to generate recipe',
      details: error.message
    });
  }
}
