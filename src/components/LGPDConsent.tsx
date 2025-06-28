'use client';
import { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';

export default function LGPDConsent({ onAccept }: { onAccept: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <Modal open={open}>
      <h2 className="text-xl font-bold mb-2">Consentimento</h2>
      <p className="mb-4">Você aceita compartilhar dados conforme a LGPD?</p>
      <Button onClick={() => { setOpen(false); onAccept(); }} className="w-full">Aceitar</Button>
    </Modal>
  );
} 