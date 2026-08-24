import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const VoiceInputButton = ({ onTranscript, currentLanguage = 'en' }) => {
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = currentLanguage === 'hi' ? 'hi-IN' : currentLanguage === 'kn' ? 'kn-IN' : 'en-US';

      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          onTranscript(finalTranscript.trim());
        }
      };

      rec.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    } else {
      setSupported(false);
    }
  }, [currentLanguage, onTranscript]);

  const toggleListening = (e) => {
    e.preventDefault();
    if (!supported || !recognition) {
      alert('Speech recognition is not available in your browser. Please type your description.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : currentLanguage === 'kn' ? 'kn-IN' : 'en-US';
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Start recognition error:', err);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`min-h-[48px] px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all duration-200 shadow-md ${
        isListening
          ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/40'
          : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-400'
      }`}
      title="Dictate with voice"
    >
      {isListening ? (
        <>
          <MicOff className="w-5 h-5 animate-bounce" />
          <span>{t('voice.listening', 'Listening... Speak now')}</span>
        </>
      ) : (
        <>
          <Mic className="w-5 h-5 text-cyan-400" />
          <span>{t('voice.start', 'Speak Description')}</span>
        </>
      )}
    </button>
  );
};
