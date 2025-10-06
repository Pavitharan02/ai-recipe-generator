import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useChatContext } from "@/contexts/ChatContext";
import { Plus, X } from "lucide-react";

export const IngredientManager = () => {
  const { ingredients, addIngredient, removeIngredient }: any = useChatContext();
  const [newIngredient, setNewIngredient] = useState("");

  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      addIngredient(newIngredient);
      setNewIngredient("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Available Ingredients</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add an ingredient..."
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleAddIngredient} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {ingredients.map((ingredient: string, index: number) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1 bg-black text-white"
            >
              {ingredient}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent text-white"
                onClick={() => removeIngredient(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {ingredients.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No ingredients added yet. Add some ingredients to get recipe suggestions!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};