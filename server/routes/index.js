

import express from "express";
import ollama from "ollama";
import { getNutrientsForIngredients } from "../utils/ingredients.js";

const router = express.Router();




router.post("/ask", async (req, res) => {
  const { conversationHistory, prompt, model, systemMessage, images } = req.body;

  try {
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    // Try to extract ingredient names from the prompt and conversation
    // (Simple heuristic: look for lines like "Ingredients: ..." or lists)
    let ingredientNames = [];
    const ingredientRegex = /ingredients?[:\-\s]*([\w\s,]+)/i;
    // Check prompt
    let match = prompt && prompt.match(ingredientRegex);
    if (match && match[1]) {
      ingredientNames = match[1].split(/,|\n|\r|\s{2,}|\s-\s/).map(s => s.trim()).filter(Boolean);
    }
    // Also check conversation history for user messages with ingredients
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        if (msg.role === "user" && typeof msg.content === "string") {
          let m = msg.content.match(ingredientRegex);
          if (m && m[1]) {
            ingredientNames.push(...m[1].split(/,|\n|\r|\s{2,}|\s-\s/).map(s => s.trim()).filter(Boolean));
          }
        }
      }
    }
    // Remove duplicates
    ingredientNames = [...new Set(ingredientNames)].filter(Boolean);

    let nutrientInfoText = "";
    if (ingredientNames.length > 0) {
      // Limit to 10 for context size
      const nutrients = await getNutrientsForIngredients(ingredientNames.slice(0, 10));
      // Format as markdown table
      if (nutrients.length > 0) {
        const keys = ["Descrip","Energy_kcal","Protein_g","Fat_g","Carb_g","Fiber_g","Sugar_g","Calcium_mg","Iron_mg","Potassium_mg","Sodium_mg"];
        const header = ["Ingredient", ...keys.slice(1)].join(" | ");
        const divider = keys.map(() => "---").join(" | ");
        const rows = nutrients.map(row => {
          if (row.notFound) return `${row.name} | Not found | | | | | | | | | |`;
          return keys.map(k => row[k] || "").join(" | ");
        });
        nutrientInfoText = `\n\nNutritional info for your ingredients (per 100g):\n\n| ${header} |\n| ${divider} |\n| ${rows.join(" |\n| ")} |\n`;
      }
    }

    const system = {
      role: "system",
      content: systemMessage + nutrientInfoText,
    };

    const messages = conversationHistory
      ? [system, ...conversationHistory]
      : [system];

    const response = await ollama.chat({
      model: model,
      messages: [
        ...messages,
        {
          role: "user",
          content: prompt,
          images: images,
        },
      ],
      stream: true,
    });

    for await (const part of response) {
      // Filter out thinking tags from models like qwen
      let content = part.message.content;
      if (content) {
        // Remove <think>...</think> tags and their content
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
        // Clean up any remaining empty lines
        content = content.replace(/^\s*[\r\n]/gm, '');
        
        if (content.trim()) {
          res.write(content);
        }
      }
    }

    res.end();
  } catch (error) {
    res.status(500).send("An error occurred while processing your request.");
    console.log(error);
  }
});

export default router;
