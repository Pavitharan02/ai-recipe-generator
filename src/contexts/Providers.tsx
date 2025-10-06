import { ThemeProvider } from "@/contexts/ThemeContext";
import { useChatContext, ChatProvider } from "@/contexts/ChatContext";
import { FileUploadProvider } from "@/contexts/FileUploadContext";
import { TTSProvider } from "@/contexts/TTSContext";
import { STTProvider } from "@/contexts/STTContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <FileUploadProvider>
        <ChatProvider>
          <TTSProvider>
            <STTProvider>
              {children}
            </STTProvider>
          </TTSProvider>
        </ChatProvider>
      </FileUploadProvider>
    </ThemeProvider>
  );
}
