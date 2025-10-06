// Utility to load and query cleaned_ingredients.csv for nutrient lookup

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INGREDIENTS_CSV_PATH = path.resolve(__dirname, '../../data/cleaned_ingredients.csv');

let ingredientsData = null;

// Load CSV into memory (asynchronously, once)
function loadIngredientsData() {
  return new Promise((resolve, reject) => {
    if (ingredientsData) return resolve(ingredientsData);
    const results = [];
    fs.createReadStream(INGREDIENTS_CSV_PATH)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        ingredientsData = results;
        resolve(ingredientsData);
      })
      .on('error', reject);
  });
}

// Find ingredient by name (case-insensitive, partial match allowed)
async function findIngredientByName(name) {
  await loadIngredientsData();
  if (!name) return null;
  const lower = name.toLowerCase();
  // Try exact match first
  let found = ingredientsData.find(row => row.Descrip.toLowerCase() === lower);
  if (found) return found;
  // Try partial match
  found = ingredientsData.find(row => row.Descrip.toLowerCase().includes(lower));
  return found || null;
}

// Get nutrients for a list of ingredient names
async function getNutrientsForIngredients(names) {
  await loadIngredientsData();
  return names.map(name => {
    const info = ingredientsData.find(row => row.Descrip.toLowerCase() === name.toLowerCase() || row.Descrip.toLowerCase().includes(name.toLowerCase()));
    return info ? { name, ...info } : { name, notFound: true };
  });
}

export { loadIngredientsData, findIngredientByName, getNutrientsForIngredients };
