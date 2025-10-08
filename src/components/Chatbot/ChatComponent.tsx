import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useChatContext } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";
import { ArrowUp, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { ChatInput } from "./ChatInput";
import { MobileRecipePanel } from "@/components/Recipe/MobileRecipePanel";
import { TTSButton } from "@/components/common/TTSButton";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

function cleanLLMMarkdown(raw: string) {
  let text = raw;
  
  // Ensure line break only after bullet list items, not numbered lists
  text = text.replace(/(^\* [^*\n]+[.!?)])\s+(?=[A-Z0-9(])/gm, '$1\n\n');

  // Add space after colon in bold heading if followed by text (not table)
  text = text.replace(/(\*\*[^*]+\*\*):([^\n|])/g, '$1: $2');

  // Split ## heading if it contains a table (|), so heading is separate
  text = text.replace(/(##[^\|\n]*?)\|/g, '$1\n|');

  // Ensure heading (#, ##, ###, etc.) has a newline before it
  text = text.replace(/([^\n])(?=(#{1,6}\s))/g, '$1\n');

  // Add newline between bullets that are concatenated on the same line
  text = text.replace(/(- [^-*\n]+?)(?=- )/g, '$1\n');

  // Step 1: ensure there is a space between DV and Minerals if stuck together
  text = text.replace(/DV(?=Minerals:)/g, 'DV ');

  // Step 2: insert a newline before Minerals: if it’s not already on a new line
  text = text.replace(/([^\n])\s*(Minerals:)/g, '$1\n\n$2');

  // Remove setext-style heading underlines
  text = text.replace(/^\s*[=-]{3,}\s*$/gm, '');
  text = text.replace(/([^\n])\s*[=-]{3,}(?=\s*#|$)/g, '$1');

  // Ensure bold headings have blank lines around them (with or without colon)
  text = text.replace(/(\*\*[^*]+\*\*)/g, '\n$1\n');

  // Add newline after bold heading if table starts immediately after
  text = text.replace(/(\*\*[^*]+\*\*:?.*?)\|/g, '$1\n|');

  // Add blank line after markdown tables
  text = text.replace(/((?:^|\n)(?:\|.+\|\n)+)([^|\n])/gm, '$1\n$2');

  // Separate back-to-back bold headings properly
  text = text.replace(/(\*\*[^*]+\*\*)(?=\*\*[^*]+\*\*)/g, '$1\n');

  // Handle concatenated numbered lists
  text = text.replace(/([a-zA-Z])(\d+\.\s)/g, '$1\n$2');

  // **NEW: Fix concatenated bullet points at root level**
  text = text.replace(/(\*\s[^\n*]+)(\*\s)/g, '$1\n$2');
  
  // **NEW: Fix concatenated bullet points after numbered items**
  text = text.replace(/(\d+\.\s\*\*[^*]+\*\*[^\n]+)(\*\s)/g, '$1\n$2');
  
  // **NEW: Separate lowercase word followed immediately by asterisk (bullet)**
  text = text.replace(/([a-z)])(\*\s)/g, '$1\n$2');
  
  // **NEW: Fix text concatenated after bullet points (like "EdamamePlease")**
  text = text.replace(/([a-z)])([A-Z][a-z])/g, '$1\n\n$2');

  // Fix concatenated text (split on lowercase followed by uppercase)
  text = text.replace(/([a-z])([A-Z])/g, '$1\n\n$2');

  // Add space after lowercase letters or commas followed by numbers
  text = text.replace(/([a-z,:])([0-9])/g, '$1 $2');

  // Add blank line after numbered list items if followed by a heading
  text = text.replace(/(\d+\..+)(\n)(\*\*[^*]+\*\*)/g, '$1\n\n$3');

  // Fix text concatenated on same line between two bold headings
  // E.g., "**Time:**\n5 minutes\n**Next**" should become "**Time:**\n5 minutes\n\n**Next**"
  text = text.replace(/(\*\*[^*]+\*\*[:\s]*\n)([^\n]+\n)(\*\*[^*]+\*\*)/g, '$1$2\n$3');

  // Remove duplicate empty lines
  text = text.replace(/\n{3,}/g, '\n\n');

  // Trim
  return text.trim();
}


// Component to render cleaned markdown
const MarkdownRenderer = ({ content }: { content: string }) => {
  const cleanedContent = cleanLLMMarkdown(content);
  
  // Debug: print raw text
  console.log('Raw content:', content);
  console.log('Cleaned content:', cleanedContent);
  
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          table: ({ children }) => (
            <table className="border-collapse border border-gray-300 my-4">
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-4 py-2 bg-gray-100">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-4 py-2">
              {children}
            </td>
          ),
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    </div>
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
                        <MarkdownRenderer content={entry.content} />
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
                      <MarkdownRenderer content={responseStream} />
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
