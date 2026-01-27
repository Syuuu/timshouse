const DEFAULT_LANG = 'ja-JP';
const DEFAULT_RATE = 0.95;
const DEFAULT_PITCH = 1.05;

function playSpeechSynthesis(text, { lang = DEFAULT_LANG, rate = DEFAULT_RATE, pitch = DEFAULT_PITCH } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      reject(new Error('speechSynthesis unavailable'));
      return;
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = rate;
    utter.pitch = pitch;

    const voices = window.speechSynthesis.getVoices();
    const jpVoice = voices.find((v) => v.lang === lang || v.name.toLowerCase().includes('japanese'));
    if (jpVoice) {
      utter.voice = jpVoice;
    }

    utter.onend = () => resolve();
    utter.onerror = () => reject(new Error('speechSynthesis error'));

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  });
}

function playAudioBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('audio playback error'));
    };
    audio.play().catch((error) => {
      URL.revokeObjectURL(url);
      reject(error);
    });
  });
}

export async function playTts(text, options = {}) {
  if (!text) return;
  const { onStart, onEnd } = options;

  if (typeof window === 'undefined') return;

  try {
    onStart?.();
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`TTS request failed: ${response.status}`);
    }

    const blob = await response.blob();
    await playAudioBlob(blob);
    onEnd?.();
  } catch (error) {
    try {
      await playSpeechSynthesis(text, options);
      onEnd?.();
    } catch (fallbackError) {
      onEnd?.();
      throw fallbackError;
    }
  }
}
