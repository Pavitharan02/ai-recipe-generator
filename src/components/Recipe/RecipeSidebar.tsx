import { IngredientManager } from "@/components/Recipe/IngredientManager";
import { DietaryPreferences } from "@/components/Recipe/DietaryPreferences";
import { RecipeGenerator } from "@/components/Recipe/RecipeGenerator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export const RecipeSidebar = () => {
  return (
    <div className="w-80 min-w-80 border-r bg-sidebar flex flex-col h-full hidden lg:flex">
      <div className="p-4 border-b text-white">
        <h2 className="text-xl font-bold text-center">Recipe Assistant</h2>
        <p className="text-sm text-muted-foreground text-center mt-1" style={{color: 'white'}}>
          Build your perfect recipe
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <IngredientManager />
          <Separator />
          <DietaryPreferences />
          <Separator />
          <RecipeGenerator />
        </div>
      </ScrollArea>
    </div>
  );
};