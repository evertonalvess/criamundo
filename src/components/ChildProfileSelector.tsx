'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ChildProfileSelector() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    supabase.from('child_profiles').select('*').then(({ data }) => setProfiles(data || []));
  }, []);

  return (
    <select value={selected} onChange={e => setSelected(e.target.value)} className="text-black p-2 rounded">
      <option value="">Selecione</option>
      {profiles.map(p => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
} 