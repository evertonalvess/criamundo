import { speakText } from '../../../lib/tts';

export default async function Story({ params }: { params: { id: string } }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stories/${params.id}`);
  const story = await res.json();

  return (
    <main className="min-h-screen bg-cover p-4" style={{backgroundImage: 'url(/backgrounds/listening.jpg)'}}>
      <div className="bg-card backdrop-blur-md p-6 rounded-lg max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{story.title}</h1>
        <p className="mb-4 whitespace-pre-line">{story.content}</p>
        <button onClick={() => speakText(story.content)} className="bg-primary text-white px-4 py-2 rounded">Ouvir</button>
      </div>
    </main>
  );
} 