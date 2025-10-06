import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useChatContext } from "@/contexts/ChatContext";
import { ChefHat, Sparkles } from "lucide-react";

export const RecipeGenerator = () => {
  const { ingredients, handleAskPrompt, responseStreamLoading }: any = useChatContext();

  const generateRecipe = (event: any) => {
    handleAskPrompt(event);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold">Recipe Generator</h3>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            {ingredients.length > 0 
              ? `Generate a recipe using your ${ingredients.length} ingredient${ingredients.length === 1 ? '' : 's'}`
              : "Add some ingredients above to get started"
            }
          </p>

          <Button 
            onClick={generateRecipe}
            disabled={ingredients.length === 0 || responseStreamLoading}
            className="w-full max-w-xs"
            size="lg"
          >
            {responseStreamLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Recipe
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};