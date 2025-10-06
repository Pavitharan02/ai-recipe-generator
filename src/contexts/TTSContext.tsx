import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface TTSContextType {
  isPlaying: boolean;
  currentlyPlaying: string | null;
  speak: (text: string, messageId: string, language?: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setVolume: (volume: number) => void;
  volume: number;
  isSupported: boolean;
}

const TTSContext = createContext<TTSContextType | null>(null);

// Language mapping for Web Speech API
const languageMap: { [key: string]: string } = {
  'English': 'en-US',
  'Swahili': 'sw-KE',
  'Luganda': 'en-US', // Fallback to English
  'Lango': 'en-US', // Fallback to English
  'Acholi': 'en-US', // Fallback to English
  'Lugisu': 'en-US', // Fallback to English
  'Iteso': 'en-US', // Fallback to English
  'Runyankole-Rukiga': 'en-US', // Fallback to English
  'Runyoro-Kitara': 'en-US', // Fallback to English
  'Lusoga': 'en-US', // Fallback to English
  'Ateso': 'en-US', // Fallback to English
  'Lubwisi (Lugbara)': 'en-US', // Fallback to English
};

export const TTSProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(0.8);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if Speech Synthesis is supported
    setIsSupported('speechSynthesis' in window);
  }, []);

  const speak = (text: string, messageId: string, language: string = 'English') => {
    try {
      if (!isSupported) {
        console.warn('Speech synthesis not supported');
        return;
      }

      // Stop any currently playing speech
      stop();

      // Clean the text for TTS (remove markdown formatting)
      const cleanText = text
        .replace(/[#*`_~\[\]]/g, '') // Remove markdown formatting
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\*\*/g, '') // Remove bold markdown
        .replace(/\*/g, '') // Remove italic markdown
        .replace(/`/g, '') // Remove code markdown
        .replace(/#{1,6}\s*/g, '') // Remove heading markdown
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with text only
        .trim();

      if (!cleanText) return;

      // Get language code
      const langCode = languageMap[language] || 'en-US';

      // Create speech utterance
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = langCode;
      utterance.volume = volume;
      utterance.rate = 0.9; // Slightly slower for better comprehension

      // Set up event listeners
      utterance.onstart = () => {
        setIsPlaying(true);
        setCurrentlyPlaying(messageId);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentlyPlaying(null);
        utteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        console.error('TTS error:', event.error);
        setIsPlaying(false);
        setCurrentlyPlaying(null);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('TTS error:', error);
      setIsPlaying(false);
      setCurrentlyPlaying(null);
    }
  };

  const stop = () => {
    if (utteranceRef.current) {
      speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    setIsPlaying(false);
    setCurrentlyPlaying(null);
  };

  const pause = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsPlaying(false);
    }
  };

  const resume = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsPlaying(true);
    }
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    if (utteranceRef.current) {
      utteranceRef.current.volume = newVolume;
    }
  };

  return (
    <TTSContext.Provider
      value={{
        isPlaying,
        currentlyPlaying,
        speak,
        stop,
        pause,
        resume,
        setVolume,
        volume,
        isSupported,
      }}
    >
      {children}
    </TTSContext.Provider>
  );
};

export const useTTS = () => {
  const context = useContext(TTSContext);
  if (!context) {
    throw new Error('useTTS must be used within a TTSProvider');
  }
  return context;
};