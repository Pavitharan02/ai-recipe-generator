import { useState } from "react";
import { IngredientManager } from "@/components/Recipe/IngredientManager";
import { DietaryPreferences } from "@/components/Recipe/DietaryPreferences";
import { RecipeGenerator } from "@/components/Recipe/RecipeGenerator";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChefHat, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const MobileRecipePanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="lg:hidden border-b bg-muted/20">
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 h-auto justify-between"
      >
        <div className="flex items-center gap-2">
          <ChefHat className="h-5 w-5" />
          <span className="font-semibold">Recipe Tools</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="p-4 space-y-4">
          <IngredientManager />
          <Separator />
          <DietaryPreferences />
          <Separator />
          <RecipeGenerator />
        </div>
      </div>
    </div>
  );
};