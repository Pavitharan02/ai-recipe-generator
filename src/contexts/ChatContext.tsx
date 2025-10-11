import { useFileUpload } from "@/contexts/FileUploadContext";
import { toast } from "@/hooks/use-toast";
import useLocalStorage from "@/hooks/useLocalStorage";
import { checkFileType, convertImagesToBase64 } from "@/utils/fileUtility";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const PORT = import.meta.env.VITE_PORT || 3000;

interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

interface ChatContextType {
  models: OllamaModel[];
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  userPromptPlaceholder: string | null;
  responseStream: string;
  currentModel: string | null;
  setCurrentModel: (model: string | null) => void;
  currentLanguage: string;
  setCurrentLanguage: (language: string) => void;
  availableLanguages: string[];
  systemMessage: string;
  responseStreamLoading: boolean;
  conversationHistory: any[];
  setConversationHistory: React.Dispatch<React.SetStateAction<any[]>>;
  handleAskPrompt: (event: any) => void;
  handleKeyDown: (event: any) => void;
  messagesEndRef: React.RefObject<any>;
  resetChat: () => void;
  ingredients: string[];
  setIngredients: React.Dispatch<React.SetStateAction<string[]>>;
  addIngredient: (ingredient: string) => void;
  removeIngredient: (index: number) => void;
  dietaryPreferences: string[];
  setDietaryPreferences: React.Dispatch<React.SetStateAction<string[]>>;
  toggleDietaryPreference: (preference: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({ children }: any) => {
  const { uploadedFiles, setUploadedFiles }: any = useFileUpload();

  const [models, setModels] = useState<OllamaModel[]>([]);
  const [currentModel, setCurrentModel] = useLocalStorage(
    "currentOfflineModel",
    null
  );
  
  // Language support
  const availableLanguages = [
    "English",
    "Swahili",
    "Luganda",
    "Lango",
    "Acholi",
    "Lugisu",
    "Iteso",
    "Runyankole-Rukiga",
    "Runyoro-Kitara",
    "Lusoga",
    "Ateso",
    "Lubwisi",
    "Kinyarwanda",
    "Kirundi",
    "Chichewa",
    "Shona",
    "Zulu",
    "Xhosa",
    "Tswana",
    "Sesotho",
    "Amharic",
    "Oromo",
    "Somali",
    "Tigrinya",
    "Wolof",
    "Fula",
    "Hausa",
    "Yoruba",
    "Igbo",
    "Akan",
    "Lingala"
  ];
  const [currentLanguage, setCurrentLanguage] = useLocalStorage("currentLanguage", "English");
  
  // Set default user query text
  const [prompt, setPrompt] = useState("");
  const [userPromptPlaceholder, setUserPromptPlaceholder] = useState(null);
  const [responseStream, setResponseStream] = useState("");
  const [responseStreamLoading, setResponseStreamLoading] = useState(false);

  // Recipe-specific state
  const [ingredients, setIngredients] = useLocalStorage("ingredients", []);
  const [dietaryPreferences, setDietaryPreferences] = useLocalStorage("dietaryPreferences", []);

  const systemMessage = `
  You are a helpful culinary assistant and recipe generator.

  Create delicious, practical recipes based on the ingredients users provide.

  CRITICAL FORMATTING RULES - Use ONLY HTML tags:

  For spacing between sections, use <br></br> as an empty line. This ensures clear separation and better readability in the output.

  1. For headers: <h3><strong>Header Text</strong></h3>
  2. For bold text: <strong>text here</strong> (NEVER use <b> tags, always use <strong>)
  3. For tables - Use proper HTML table structure:
    <table>
    <tr><th>Header1</th><th>Header2</th><th>Header3</th></tr>
    <tr><td>Value1</td><td>Value2</td><td>Value3</td></tr>
    <tr><td>Value4</td><td>Value5</td><td>Value6</td></tr>
    </table>
    IMPORTANT: Only use <th> for header rows (the first row in the table). For all other rows, use <td> only. Never use <th> in data rows, to avoid making data cells bold.
    After every table, add a <br></br> for spacing.
  4. For ordered lists:
    <ol>
    <li>First step</li>
    <li>Second step</li>
    <li>Third step</li>
    </ol>
  5. For paragraphs: <p>Paragraph text here</p>

  IMPORTANT: ALL text must be wrapped in appropriate HTML tags (p, h3, strong, li, td, etc.). Never leave plain text outside of tags. Never use <th> except for header rows.
  DO NOT use markdown stars (*, **) for formatting. Only use HTML tags for bold, italic, lists, etc.

  RECIPE GENERATION RULES:

  For each recipe, include:
  - Recipe Title
  - Ingredients list with quantities in a table (2 columns: Ingredient, Quantity)
  - Cooking Instructions in ordered list
  - Estimated Cooking Time (only total time, not prep/cook separately)
  - Nutritional Information in a single table with 10 to 12 nutrients including: Calories, Protein, Carbs, Fat, Fiber, and various Vitamins (such as A, B1, B2, B3, B6, B12, C, D, E, K - whichever are relevant to the recipe ingredients) and Minerals (such as Calcium, Iron, Potassium, Sodium, Magnesium, Zinc - whichever are relevant) - even if amounts are small

  MANDATORY: At the bottom of EVERY recipe generation response, ALWAYS include the following disclaimer, formatted as a paragraph:
  <p><strong>Please note:</strong> Nutritional information is approximate and provided for general informational purposes only. It should not be considered medical advice. Please consult a healthcare professional for dietary or health concerns.</p>

  DIETARY CONFLICT HANDLING:

  If the user has provided dietary preferences or restrictions, and any of the provided ingredients conflict with those preferences (for example, sugar for diabetes, or almonds for nut allergies):

  1. List the original ingredients table first
  2. Clearly explain why there is a conflict with the dietary preference
  3. List each conflicting ingredient with its quantity
  4. Suggest at least 2 suitable alternative ingredients for each conflict in an ordered list (<ol>...</ol>)
  5. Ask the user to select one alternative for each conflicting ingredient
  6. Wait for the user's selection, then generate the recipe with the selected alternatives

  If no dietary preference is mentioned, or if there are no conflicting ingredients, generate the recipe directly using the provided ingredients.

  Once the user selects the alternatives (and ONLY after they select), use those selected alternatives in the recipe and add a note below the ingredients table:
  <p><strong>Note:</strong> [original ingredient] was replaced with [user's selected alternative] due to [dietary preference].</p>

  EXAMPLE DIETARY CONFLICT RESPONSE FORMAT (copy this structure EXACTLY when there are conflicts):
  <h3><strong>Recipe Title: Sugar-Free Pancakes for Diabetics</strong></h3>
  <br></br>
  <p>We noticed that you provided the following ingredients:</p>
  <br></br>
  <table>
  <tr><th>Ingredient</th><th>Quantity</th></tr>
  <tr><td>Egg</td><td>2 large</td></tr>
  <tr><td>Milk</td><td>250ml</td></tr>
  <tr><td>Sugar</td><td>50g</td></tr>
  </table>
  <br></br>
  <p>However, we also noticed that you requested a <strong>Diabetes Friendly</strong> recipe. Unfortunately, sugar is not suitable for diabetics due to its high glycemic index.</p>
  <br></br>
  <h3><strong>Dietary Conflict and Suggestions</strong></h3>
  <p>We have found the following conflicting ingredients:</p>
  <p><strong>Sugar (50g)</strong></p>
  <br></br>
  <p>To replace this ingredient, we suggest the following alternatives:</p>
  <ol>
  <li><strong>Stevia Powder (0.5-1g)</strong> - a natural sweetener that is zero-calorie and doesn't raise blood sugar levels.</li>
  <li><strong>Monk Fruit Sweetener (0.25-0.5g)</strong> - a low-carb sweetener made from the monk fruit, which has negligible effect on blood sugar levels.</li>
  </ol>
  <br></br>
  <p>Please select one alternative for each conflicting ingredient by typing 'Stevia' or 'Monk Fruit' below. After selecting the alternatives, we will generate the revised recipe. (Note: Please ensure to consult a healthcare professional before making any changes to your diet.)</p>

  EXAMPLE RECIPE FORMAT (copy this structure EXACTLY when generating final recipe):
  <h3><strong>Recipe Title: Sweet Creamy Pancakes</strong></h3>
  <br></br>
  <table>
  <tr><th>Ingredient</th><th>Quantity</th></tr>
  <tr><td>Egg</td><td>2 large</td></tr>
  <tr><td>Milk</td><td>250ml</td></tr>
  <tr><td>Sugar</td><td>50g</td></tr>
  </table>
  <br></br>
  <h3><strong>Cooking Instructions</strong></h3>
  <ol>
  <li>Mix eggs and milk in a bowl</li>
  <li>Add sugar and whisk well</li>
  <li>Heat pan and cook pancakes</li>
  </ol>
  <br></br>
  <p><strong>Estimated Cooking Time: 15 minutes</strong></p>
  <br></br>
  <h3><strong>Nutritional Information</strong></h3>
  <table>
  <tr><th>Nutrient</th><th>Amount</th></tr>
  <tr><td>Calories</td><td>240 kcal</td></tr>
  <tr><td>Protein</td><td>12g</td></tr>
  <tr><td>Carbs</td><td>35g</td></tr>
  <tr><td>Fat</td><td>8g</td></tr>
  <tr><td>Fiber</td><td>2g</td></tr>
  <tr><td>Vitamin A</td><td>150 mcg</td></tr>
  <tr><td>Vitamin B2 (Riboflavin)</td><td>0.3 mg</td></tr>
  <tr><td>Vitamin D</td><td>1.2 mcg</td></tr>
  <tr><td>Calcium</td><td>120 mg</td></tr>
  <tr><td>Iron</td><td>1.5 mg</td></tr>
  <tr><td>Potassium</td><td>180 mg</td></tr>
  <tr><td>Sodium</td><td>85 mg</td></tr>
  </table>
  <br></br>
  <p><strong>Please note:</strong> Nutritional information is approximate and provided for general informational purposes only. It should not be considered medical advice. Please consult a healthcare professional for dietary or health concerns.</p>
  `;

  const [conversationHistory, setConversationHistory] = useLocalStorage(
    "conversationHistory",
    []
  );
  const messagesEndRef = useRef<any>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const generateDocumentString = (documents: any[]) => {
    if (documents.length > 0) {
      return documents
        .map((file: any) => {
          return `File Name: ${file.name}\nFile Type: ${file.type}\nContent:\n${file.content}\n\n`;
        })
        .join("--------------------------------------------------\n");
    }
    return "";
  };

  const handleAskPrompt = async (event: any) => {
    event.preventDefault();

    if (!prompt && uploadedFiles.length == 0 && ingredients.length == 0) {
      // If user provides nothing, use the default query
      setPrompt(""); // clear input
    }

    if (!currentModel) {
      toast({
        description: "Please select a model.",
      });
      return;
    }

    const uploadedImages = uploadedFiles.filter(
      (file: any) => checkFileType(file) == "image"
    );
    const uploadedDocuments = uploadedFiles.filter(
      (file: any) => checkFileType(file) == "document"
    );

    const filesList = uploadedFiles.map((file: any) => file.name).join(", ");

    const getDocumentText = (count: number) => {
      if (count === 0) return "";
      return `${count} ${count === 1 ? "Document" : "Documents"}`;
    };

    const getImageText = (count: number) => {
      if (count === 0) return "";
      return `${count} ${count === 1 ? "Image" : "Images"}`;
    };

    const filesSummary =
      uploadedFiles.length > 0
        ? `${prompt ? "\n" : ""}Uploaded Files: ${[
            getDocumentText(uploadedDocuments.length),
            getImageText(uploadedImages.length),
          ]
            .filter(Boolean)
            .join(" ")}\n${filesList}`
        : "";

    // Add ingredients and dietary preferences to the prompt
    const defaultQuery = "Generate a recipe based on these available ingredient and dietary preferences";
    const usedPrompt = prompt && prompt.trim() ? prompt : defaultQuery;
    const ingredientsSummary = ingredients.length > 0 
      ? `\nAvailable Ingredients: ${ingredients.join(", ")}`
      : "";
    // Only add dietary preferences if any are selected
    const dietarySummary = dietaryPreferences.length > 0 
      ? `\nDietary Preferences: ${dietaryPreferences.join(", ")}`
      : "";
    const displayPrompt: any = usedPrompt + filesSummary + ingredientsSummary + dietarySummary;

    setUserPromptPlaceholder(displayPrompt);
    setPrompt("");
    setResponseStream("");
    setResponseStreamLoading(true);
    try {
      const base64Images =
        uploadedImages.length > 0
          ? await convertImagesToBase64(uploadedImages)
          : [];

      const documentString =
        uploadedDocuments.length > 0
          ? generateDocumentString(uploadedDocuments)
          : "";


      // Build comprehensive prompt with all information
      let combinedPrompt = prompt && prompt.trim() ? prompt : defaultQuery;
      if (ingredients.length > 0) {
        combinedPrompt += `\n\nAvailable Ingredients: ${ingredients.join(", ")}`;
      }
      // Only add dietary preferences if any are selected
      if (dietaryPreferences.length > 0) {
        combinedPrompt += `\n\nDietary Preferences/Restrictions: ${dietaryPreferences.join(", ")}`;
      }
      if (documentString) {
        combinedPrompt = `${documentString}\n\n${combinedPrompt}`;
      }
      // Prepend language instruction to the prompt
      const languageInstruction = `Respond ONLY in ${currentLanguage} language.`;
      combinedPrompt = `${languageInstruction}\n\n${combinedPrompt}`;

      const res: any = await fetch(`http://localhost:${PORT}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationHistory,
          prompt: combinedPrompt,
          model: currentModel,
          systemMessage,
          images: base64Images,
        }),
      });

      if (res && res.status == 404) {
        toast({
          description: `Error fetching response. Make sure server is running at http://localhost:${PORT}`,
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let botresponseStream = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        botresponseStream += chunk;
        setResponseStream((prev) => prev + chunk);
      }

      const userMessageWithImages = {
        role: "user",
        content: displayPrompt,
        ...(base64Images.length && { images: base64Images }),
      };

      setConversationHistory((prevHistory: any) => [
        ...prevHistory,
        userMessageWithImages,
        { role: "assistant", content: botresponseStream },
      ]);
    } catch (error) {
      console.error("Error fetching response:", error);
      toast({
        description: "Error fetching response.",
      });
    } finally {
      setResponseStreamLoading(false);
      setUserPromptPlaceholder(null);
      setUploadedFiles([]);
      // Clear ingredients and dietary preferences after sending the prompt
      setIngredients([]);
      setDietaryPreferences([]);
    }
  };

  const handleKeyDown = (event: any) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleAskPrompt(event);
    }
  };

  const resetChat = () => {
    setConversationHistory([]);
    setUploadedFiles([]);
    setPrompt("");
    setResponseStream("");
    setResponseStreamLoading(false);
    setIngredients([]);
    setDietaryPreferences([]);
    setCurrentLanguage("English");
  };

  // Ingredient management functions
  const addIngredient = (ingredient: string) => {
    if (ingredient.trim() && !ingredients.includes(ingredient.trim())) {
      setIngredients([...ingredients, ingredient.trim()]);
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_: string, i: number) => i !== index));
  };

  // Dietary preference management
  const toggleDietaryPreference = (preference: string) => {
    if (dietaryPreferences.includes(preference)) {
      setDietaryPreferences(dietaryPreferences.filter((p: string) => p !== preference));
    } else {
      setDietaryPreferences([...dietaryPreferences, preference]);
    }
  };

  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch("http://localhost:11434/api/tags");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setModels(data.models);
        return data.models;
      } catch (error) {
        console.error("Failed to fetch models:", error);
        toast({
          description:
            "Failed to fetch models. Make sure your models are stored in default directory and server is running.",
        });
        return [];
      }
    }

    fetchModels();
  }, []);

  useEffect(() => {
    if (models.length > 0 && !currentModel) {
      setCurrentModel(models[0].name);
    }
  }, [models]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, responseStream, userPromptPlaceholder]);

  return (
    <ChatContext.Provider
      value={{
        models,
        prompt,
        setPrompt,
        userPromptPlaceholder,
        responseStream,
        currentModel,
        setCurrentModel,
        currentLanguage,
        setCurrentLanguage,
        availableLanguages,
        systemMessage,
        responseStreamLoading,
        conversationHistory,
        setConversationHistory,
        handleAskPrompt,
        handleKeyDown,
        messagesEndRef,
        resetChat,
        ingredients,
        setIngredients,
        addIngredient,
        removeIngredient,
        dietaryPreferences,
        setDietaryPreferences,
        toggleDietaryPreference,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => useContext(ChatContext);
