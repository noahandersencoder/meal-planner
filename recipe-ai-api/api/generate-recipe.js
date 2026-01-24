import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

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

    const prompt = `You are a helpful cooking assistant. Create a recipe using the following ingredients: ${ingredients.join(', ')}.

${dietaryStr}
${cuisineStr}

Generate a complete recipe in JSON format with the following structure. Be creative but practical. Estimate realistic costs and times.

{
  "name": "Recipe Name",
  "description": "A brief 1-2 sentence description of the dish",
  "prepTime": 10,
  "cookTime": 20,
  "servings": 4,
  "difficulty": "easy",
  "costLevel": 2,
  "tags": ["tag1", "tag2"],
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": 1.5,
      "unit": "cups",
      "cost": 2.50,
      "category": "produce"
    }
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ]
}

Rules:
- prepTime and cookTime are in minutes (integers)
- difficulty must be one of: "easy", "medium", "hard"
- costLevel must be 1, 2, or 3 (representing $, $$, $$$)
- Valid tags include: vegetarian, vegan, dairy-free, gluten-free, red-meat, poultry, fish, quick
- Valid categories for ingredients: produce, meat, seafood, dairy, pantry, spices, baking, frozen, other
- Valid units: whole, cup, cups, tbsp, tsp, oz, lb, g, ml, can, bunch, head, cloves, stalks, sprigs, slices, pint, packet
- Include all provided ingredients, and add common pantry items (salt, pepper, oil) as needed
- Instructions should be clear, numbered implicitly by array position
- Cost should be a realistic USD estimate for that amount of ingredient

Return ONLY valid JSON. No markdown, no code blocks, no explanation.`;

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

    return res.status(200).json({ recipe });
  } catch (error) {
    console.error('Error generating recipe:', error);
    return res.status(500).json({
      error: 'Failed to generate recipe',
      details: error.message
    });
  }
}
