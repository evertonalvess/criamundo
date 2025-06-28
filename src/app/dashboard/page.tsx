import Link from 'next/link';

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-cover" style={{backgroundImage: 'url(/backgrounds/starry-night.jpg)'}}>
      <header className="p-4 text-center text-2xl font-bold">Dashboard</header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <Link href="/create" className="bg-secondary text-white p-6 rounded-lg text-center">Criar História</Link>
        <div className="bg-card p-6 rounded-lg">Favoritas</div>
        <div className="bg-card p-6 rounded-lg">Populares</div>
      </div>
    </main>
  );
} 