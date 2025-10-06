import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSTT } from '@/contexts/STTContext';
import { useChatContext } from '@/contexts/ChatContext';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export const STTButton = () => {
  const { isRecording, isProcessing, startRecording, stopRecording, isSupported, error } = useSTT();
  const { setPrompt }: any = useChatContext();

  // Listen for transcription results
  useEffect(() => {
    const handleTranscription = (event: any) => {
      const transcribedText = event.detail.text;
      if (transcribedText) {
        setPrompt((prevPrompt: string) => {
          // If there's existing text, add a space before the new text
          const separator = prevPrompt.trim() ? ' ' : '';
          return prevPrompt + separator + transcribedText;
        });
      }
    };

    window.addEventListener('speechTranscription', handleTranscription);
    return () => window.removeEventListener('speechTranscription', handleTranscription);
  }, [setPrompt]);

  // Show error messages
  useEffect(() => {
    if (error) {
      toast({
        description: error,
        variant: "destructive",
      });
    }
  }, [error]);

  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getIcon = () => {
    if (isProcessing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (isRecording) {
      return <MicOff className="h-4 w-4" />;
    }
    return <Mic className="h-4 w-4" />;
  };

  const getTooltip = () => {
    if (isProcessing) {
      return 'Processing speech...';
    }
    if (isRecording) {
      return 'Stop recording';
    }
    return 'Start voice input';
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      disabled={isProcessing}
      className={cn(
        "h-10 w-10",
        isRecording && "text-600 border-red-400",
        isProcessing && "opacity-50"
      )}
      title={getTooltip()}
    >
      {getIcon()}
    </Button>
  );
};