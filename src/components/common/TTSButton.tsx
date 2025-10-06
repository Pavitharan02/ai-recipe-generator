import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTTS } from '@/contexts/TTSContext';
import { useChatContext } from '@/contexts/ChatContext';
import { cn } from '@/lib/utils';

interface TTSButtonProps {
  text: string;
  messageId: string;
  className?: string;
}

export const TTSButton = ({ text, messageId, className }: TTSButtonProps) => {
  const { speak, stop, pause, resume, isPlaying, currentlyPlaying, isSupported } = useTTS();
  const { currentLanguage }: any = useChatContext();

  // Don't render the button if TTS is not supported
  if (!isSupported) {
    return null;
  }

  const isCurrentlyPlaying = isPlaying && currentlyPlaying === messageId;
  const isOtherPlaying = isPlaying && currentlyPlaying !== messageId;

  const handleClick = () => {
    if (isCurrentlyPlaying) {
      // If this message is currently playing, pause it
      pause();
    } else if (isOtherPlaying) {
      // If another message is playing, stop it and start this one
      stop();
      setTimeout(() => speak(text, messageId, currentLanguage), 100);
    } else {
      // If nothing is playing, start this message
      speak(text, messageId, currentLanguage);
    }
  };

  const getIcon = () => {
    if (isCurrentlyPlaying) {
      return <Pause className="h-4 w-4" />;
    }
    return <Volume2 className="h-4 w-4" />;
  };

  const getTooltip = () => {
    if (isCurrentlyPlaying) {
      return 'Pause speech';
    }
    return 'Read aloud';
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        "h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity",
        isCurrentlyPlaying && "opacity-100 text-primary",
        className
      )}
      title={getTooltip()}
    >
      {getIcon()}
    </Button>
  );
};