'use client';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';
import { generateStory } from '../../lib/gemini';
import { useState } from 'react';

export default function Create() {
  const { isRecording, transcript, startRecording } = useVoiceRecording();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const story = await generateStory(transcript, 5);
    window.location.href = `/story/${story.id}`;
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-cover" style={{backgroundImage: 'url(/backgrounds/storytelling.jpg)'}}>
      <button onClick={startRecording} className="bg-primary text-white w-24 h-24 rounded-full flex items-center justify-center text-2xl animate-pulse">
        🎤
      </button>
      {isRecording && <p className="mt-4">Gravando...</p>}
      {transcript && <button onClick={handleGenerate} className="mt-4 bg-secondary text-white px-4 py-2 rounded">Gerar História</button>}
      {loading && <p className="mt-4">Gerando...</p>}
    </main>
  );
} 