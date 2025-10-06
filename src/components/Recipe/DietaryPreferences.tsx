import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useChatContext } from "@/contexts/ChatContext";

const DIETARY_OPTIONS = [
	"Vegetarian",
	"Vegan",
	"Gluten Free",
	"Dairy Free",
	"Keto",
	"Paleo",
	"Low Carb",
	"Low Fat",
	"High Protein",
	"Heart Healthy",
	"Diabetes Friendly",
	"Weight Loss",
	"Kid Friendly",
	"Pregnancy Safe",
	"Allergies: Nuts",
	"Allergies: Shellfish",
	"Allergies: Soy",
	"Low Sodium",
	"Renal Friendly",
	"Senior Friendly",
];

export const DietaryPreferences = () => {
	const { dietaryPreferences, toggleDietaryPreference }: any = useChatContext();

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="text-lg font-semibold">
					Dietary Preferences
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap gap-2">
					{DIETARY_OPTIONS.map((option) => (
						<Badge
							key={option}
							variant={
								dietaryPreferences.includes(option) ? "default" : "outline"
							}
							className="cursor-pointer hover:bg-primary/80 hover:text-white"
							onClick={() => toggleDietaryPreference(option)}
						>
							{option}
						</Badge>
					))}
				</div>
				{dietaryPreferences.length > 0 && (
					<div className="mt-4">
						<p className="text-sm text-muted-foreground mb-2">
							Selected preferences:
						</p>
						<div className="flex flex-wrap gap-1">
							{dietaryPreferences.map((pref: string) => (
								<Badge
									key={pref}
									variant="secondary"
									className="text-xs bg-black text-white"
								>
									{pref}
								</Badge>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};