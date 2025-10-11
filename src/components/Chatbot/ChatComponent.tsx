import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useChatContext } from "@/contexts/ChatContext";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MobileRecipePanel } from "@/components/Recipe/MobileRecipePanel";
import { TTSButton } from "@/components/common/TTSButton";
import { Loader2, ArrowUp } from "lucide-react";
import { ChatInput } from "./ChatInput";


// Component to render HTML content with proper styling
const HtmlRenderer = ({ content }: { content: string }) => {
  console.log('Raw HTML input:', content);
  
  // Clean up common HTML issues
  let cleanedContent = content
    // Convert <b> tags to <strong> tags for consistency
    .replace(/<b>/g, '<strong>')
    .replace(/<\/b>/g, '</strong>')
    // Fix mismatched table tags (th with /td or td with /th)
    .replace(/<th>([^<]+)<\/td>/g, '<td>$1</td>')
    .replace(/<td>([^<]+)<\/th>/g, '<td>$1</td>')
    // Fix concatenated text with numbers (e.g., "for2-3" -> "for 2-3", "Time:10" -> "Time: 10")
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/([a-z]):(\d)/g, '$1: $2')
  // Handle markdown bold (**text**) and always place on a new line
  .replace(/\*\*([^*]+)\*\*/g, '<p><strong>$1</strong></p>')
    // Handle markdown italic (*text*)
    .replace(/(^|\s)\*([^*]+)\*(?=\s|$)/g, '$1<em>$2</em>')
    // Handle markdown bullets at start of line
    .replace(/^\*\s([^\n]+)/gm, '<li>$1</li>')
    // Add space after colons if missing
    .replace(/:(\S)/g, ': $1')
    // Add proper spacing after closing strong/bold tags when followed by text
    .replace(/<\/strong>([A-Z][a-z])/g, '</strong>\n\n<p>$1')
    // Wrap orphan text (text not in any tag) in paragraph tags
    .replace(/(<\/[^>]+>)\s*\n*([A-Z][^<]+)/g, '$1\n\n<p>$2</p>');
  // If any <li> tags were added, wrap them in <ul> if not already inside a list
  cleanedContent = cleanedContent.replace(/((<li>[^<]+<\/li>\s*)+)/g, '<ul>$1</ul>');
    // Remove empty <th> tags
    cleanedContent = cleanedContent.replace(/<th>\s*<\/th>/g, '');
    // Convert <th> in non-header rows to <td>
    cleanedContent = cleanedContent.replace(/(<table>\s*<tr>.*?<\/tr>)([\s\S]*?)(<\/table>)/g, (match, header, body, end) => {
      return header + body.replace(/<th>/g, '<td>').replace(/<\/th>/g, '</td>') + end;
    });
  
  // Add CSS classes to HTML elements for proper styling
  let styledContent = cleanedContent
    // Style tables
    .replace(/<table>/g, '<table class="border-collapse border border-gray-300 my-4 w-full">')
    .replace(/<th>/g, '<th class="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">')
    .replace(/<td>/g, '<td class="border border-gray-300 px-4 py-2">')
    // Style headers (make them bold by default)
    .replace(/<h3>/g, '<h3 class="font-bold text-lg mb-2 mt-6">')
    .replace(/<h2>/g, '<h2 class="font-bold text-xl mb-2 mt-6">')
    .replace(/<h1>/g, '<h1 class="font-bold text-2xl mb-3 mt-6">')
    // Style lists
    .replace(/<ol>/g, '<ol class="list-decimal pl-6 my-3 space-y-1 mb-6">')
    .replace(/<ul>/g, '<ul class="list-disc pl-6 my-3 space-y-1 mb-6">')
    .replace(/<li>/g, '<li class="mb-1">')
    // Style paragraphs
    .replace(/<p>/g, '<p class="mb-3">')
    // Style strong tags
    .replace(/<strong>/g, '<strong class="font-bold">');

  return (
    <div className="html-content text-sm leading-relaxed space-y-2" dangerouslySetInnerHTML={{ __html: styledContent }} />
  );
};

export const ChatComponent = () => {
  const {
    prompt,
    setPrompt,
    handleAskPrompt,
    handleKeyDown,
    userPromptPlaceholder,
    responseStream,
    responseStreamLoading,
    conversationHistory,
    messagesEndRef,
  }: any = useChatContext();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, responseStream, userPromptPlaceholder]);

  const messagesStartRef = useRef<HTMLDivElement>(null);
  const scrollToTop = () => {
    messagesStartRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative bg-background flex flex-col h-full">
      <MobileRecipePanel />
      <div className="overflow-y-auto flex-1">
        <div ref={messagesStartRef} className="max-w-5xl mx-auto p-4 space-y-4">
          {!conversationHistory.length && !responseStreamLoading && (
            <ChatbotWelcome />
          )}
          {conversationHistory.map((entry: any, index: any) => (
            <div key={index} className="mb-4">
              <Card
                className={cn(
                  "max-w-[80%] w-fit",
                  entry.role === "user"
                    ? "ml-auto bg-primary/10"
                    : "mr-auto border-none shadow-none"
                )}
              >
                <CardContent className="p-4">
                  {entry.role === "user" ? (
                    <div className="text-sm break-words whitespace-pre-wrap">
                      {entry.content}
                    </div>
                  ) : (
                      <div className="text-sm">
                        <HtmlRenderer content={entry.content} />
                      </div>
                  )}
                  {entry.role === "assistant" && (
                    <div className="mt-3 flex justify-start">
                      <TTSButton 
                        text={entry.content} 
                        messageId={`message-${index}`}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}

          {responseStreamLoading && (
            <>
              <div className="mb-4">
                <Card className="ml-auto max-w-[80%] bg-primary/10 w-fit">
                  <CardContent className="p-4">
                    <div className="text-sm break-words whitespace-pre-wrap">
                      {userPromptPlaceholder}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-start space-x-4 mb-4">
                <div className="pt-4 flex-shrink-0">
                  <Loader2 className="size-5 animate-spin" />
                </div>
                <Card className="max-w-[80%] border-none shadow-none w-fit">
                  <CardContent className="p-4">
                    <div className="text-sm">
                      <HtmlRenderer content={responseStream} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* Always render ChatInput at the bottom */}
      <div className="z-50 shrink-0 bg-gradient-to-t from-background via-background to-background/0">
        <div className="max-w-5xl mx-auto p-4">
          <ChatInput />
        </div>
      </div>

      <Button
        className="absolute bottom-0 right-0 m-2 text-foreground"
        onClick={scrollToTop}
        size={"icon"}
        variant={"outline"}
      >
        <ArrowUp className="size-4" />
      </Button>
    </div>
  );
};

export const ChatbotWelcome = () => {
  return (
    <div className="absolute left-0 right-0 top-0 bottom-32 flex items-center justify-center">
      <div className="text-center flex flex-col gap-6 px-8">
        <h1 className="text-4xl md:text-5xl font-bold break-words whitespace-pre-wrap" style={{color: '#08acb3'}}>
          My Meal Planner
        </h1>
        <p className="max-w-[600px] mx-auto text-center text-lg md:text-xl break-words whitespace-pre-wrap text-muted-foreground leading-relaxed">
          Your intelligent culinary companion for creating delicious recipes with whatever ingredients you have on hand. 
          Get personalized recipes with nutritional information, all powered by local AI models.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm text-muted-foreground">
          <span className="bg-muted/50 px-3 py-1 rounded-full">🥗 Custom Recipes</span>
          <span className="bg-muted/50 px-3 py-1 rounded-full">📊 Nutrition Info</span>
          <span className="bg-muted/50 px-3 py-1 rounded-full">🥬 Dietary Options</span>
          <span className="bg-muted/50 px-3 py-1 rounded-full">👨‍🍳 Cooking Tips</span>
        </div>
        <p className="text-lg font-semibold break-words whitespace-pre-wrap" style={{color: '#08acb3'}}>
          Add ingredients below and let's cook something amazing!
        </p>
      </div>
    </div>
  );
};
