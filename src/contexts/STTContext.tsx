import React, { createContext, useContext, useState, useRef } from 'react';

interface STTContextType {
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  isSupported: boolean;
  error: string | null;
}

const STTContext = createContext<STTContextType | null>(null);

export const STTProvider = ({ children }: { children: React.ReactNode }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  React.useEffect(() => {
    // Check if MediaRecorder OR Web Speech API is supported
    const hasMediaRecorder = 'MediaRecorder' in window && 
      !!navigator.mediaDevices && 
      !!navigator.mediaDevices.getUserMedia;
    
    const hasWebSpeechAPI = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    setIsSupported(hasMediaRecorder || hasWebSpeechAPI);
  }, []);

  const startRecording = async () => {
    if (!isSupported) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    try {
      setError(null);
      setIsRecording(true);
      
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      // If no API key, use Web Speech API directly
      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        console.log('Using Web Speech API');
        try {
          await transcribeWithWebSpeechAPI();
        } catch (error) {
          console.error('Web Speech API error:', error);
          setError('Failed to recognize speech. Please try again.');
        } finally {
          setIsRecording(false);
          setIsProcessing(false);
        }
        return;
      }

      // Use MediaRecorder for Whisper API
      console.log('Using Whisper API');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          await transcribeAudio(audioBlob);
        } catch (error) {
          console.error('Transcription error:', error);
          setError('Failed to transcribe audio');
        } finally {
          setIsProcessing(false);
          cleanup();
        }
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to access microphone');
      setIsRecording(false);
      setIsProcessing(false);
      cleanup();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    } else if (recognitionRef.current) {
      // Stop Web Speech API recognition
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
      recognitionRef.current = null;
      setIsRecording(false);
      setIsProcessing(false);
    } else if (isRecording) {
      // Fallback - just reset states
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping recognition during cleanup:', error);
      }
      recognitionRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsProcessing(false);
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    // If no API key is configured, try to use Web Speech API as fallback
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      return transcribeWithWebSpeechAPI();
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Dispatch custom event with transcribed text
      const transcriptionEvent = new CustomEvent('speechTranscription', {
        detail: { text: result.text }
      });
      window.dispatchEvent(transcriptionEvent);
      
      return result.text;
    } catch (error) {
      console.error('OpenAI Whisper API error:', error);
      // Fallback to Web Speech API
      return transcribeWithWebSpeechAPI();
    }
  };

  const transcribeWithWebSpeechAPI = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsProcessing(false); // We're now actively listening, not processing
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognition result:', transcript);
        
        // Dispatch custom event with transcribed text
        const transcriptionEvent = new CustomEvent('speechTranscription', {
          detail: { text: transcript }
        });
        window.dispatchEvent(transcriptionEvent);
        
        setIsRecording(false);
        setIsProcessing(false);
        recognitionRef.current = null;
        resolve(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setIsProcessing(false);
        recognitionRef.current = null;
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
        setIsProcessing(false);
        recognitionRef.current = null;
      };

      try {
        recognition.start();
      } catch (error) {
        setIsRecording(false);
        setIsProcessing(false);
        recognitionRef.current = null;
        reject(error);
      }
    });
  };

  return (
    <STTContext.Provider
      value={{
        isRecording,
        isProcessing,
        startRecording,
        stopRecording,
        isSupported,
        error,
      }}
    >
      {children}
    </STTContext.Provider>
  );
};

export const useSTT = () => {
  const context = useContext(STTContext);
  if (!context) {
    throw new Error('useSTT must be used within a STTProvider');
  }
  return context;
};