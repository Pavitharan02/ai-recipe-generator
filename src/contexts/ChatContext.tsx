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
  ALWAYS FORMAT YOUR RESPONSE IN MARKDOWN.
  You are a helpful culinary assistant and recipe generator.

  Create delicious, practical recipes based on the ingredients users provide. 
  For each recipe, include Recipe Title, Ingredients list with quantities in a table, 
  Cooking instructions, Estimated cooking time (only total time), 
  and Nutritional information (calories, protein, carbs, fat, fiber, vitamins and minerals) 
  in a single table (include at least 10). Always include some vitamins in this single table 
  even if they are small in amount.

  If any of the provided ingredients conflict with the user's selected dietary preferences or restrictions 
  (for example, sugar for diabetes), DO NOT generate or modify the recipe yet. 
  Do not replace or remove the conflicting ingredients automatically. 
  Instead, list each conflicting ingredient and suggest at least two suitable alternative ingredients for each conflict. 
  Ask the user to select one alternative for each conflicting ingredient. 
  Wait for the user's selection before generating the recipe. 

  Once the user selects the alternatives, use those in the recipe and add a note 
  below the ingredients table in this format: 
  "Note: [original ingredient] was replaced with [alternative] due to [dietary preference]."
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
    const defaultQuery = "Generate a recipe based on these available ingredient and diatery preferences";
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
