import {
  ArrowUp,
  File,
  Paperclip,
  X,
  Image,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { useChatContext } from "@/contexts/ChatContext";
import { useFileUpload } from "@/contexts/FileUploadContext";
import { checkFileType } from "@/utils/fileUtility";
import { STTButton } from "@/components/common/STTButton";

export const ChatInput = () => {
  const {
    prompt,
    setPrompt,
    handleAskPrompt,
    handleKeyDown,
    responseStreamLoading,
    currentLanguage,
    setCurrentLanguage,
    availableLanguages,
  }: any = useChatContext();

  const { uploadedFiles, handleFileUpload, removeFile, fileInputRef }: any =
    useFileUpload();


  const FilePreview = ({ file, index }: { file: any; index: number }) => {
    const fileType = checkFileType(file);

    return (
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger asChild>
          <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer">
            {fileType === "image" ? (
              <Image className="h-4 w-4" />
            ) : (
              <File className="h-4 w-4" />
            )}
            <span className="max-w-[150px] truncate">{file.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onClick={() => removeFile(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </HoverCardTrigger>
        {fileType === "image" && (
          <HoverCardContent className="w-80">
            <div className="space-y-2">
              <img
                src={file.url}
                alt={file.name}
                className="rounded-lg w-full h-auto object-cover"
              />
              <p className="text-sm text-muted-foreground">{file.name}</p>
            </div>
          </HoverCardContent>
        )}
      </HoverCard>
    );
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow">
      {uploadedFiles.length > 0 && (
        <div className="px-4 pt-4 flex gap-2 overflow-x-auto">
          {uploadedFiles.map((file: any, index: number) => (
            <FilePreview key={index} file={file} index={index} />
          ))}
        </div>
      )}

      <Label className="flex flex-col gap-2 p-4" htmlFor="prompt">
        <div className="relative flex">
                    <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for a recipe, cooking tips, or ingredient substitutions..."
            disabled={responseStreamLoading}
            className={cn(
              "min-h-[60px] w-full resize-none border-0 p-4 focus:ring-0 sm:text-sm",
              "placeholder:text-muted-foreground/70"
            )}
            style={{ outline: "none", boxShadow: "none" }}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Label
              htmlFor="file-upload"
              className="inline-flex cursor-pointer items-center justify-center rounded-md h-9 w-9 hover:bg-muted"
            >
              <Paperclip className="h-4 w-4" />
              <Input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                ref={fileInputRef}
              />
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
              <SelectTrigger className="w-36 h-10 text-foreground">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages?.map((language: string, index: number) => (
                  <SelectItem
                    key={index}
                    value={language}
                    className="text-foreground"
                  >
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <STTButton />

            <Button
              size="icon"
              className={cn(
                "h-10 w-10",
                responseStreamLoading && "animate-pulse"
              )}
              onClick={handleAskPrompt}
              disabled={responseStreamLoading}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Label>
    </div>
  );
};

export default ChatInput;
