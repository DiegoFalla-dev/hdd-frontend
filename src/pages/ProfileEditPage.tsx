import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ProfileEditPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaved(false);
    setTimeout(()=>{ setSaving(false); setSaved(true); }, 800);
  };

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <Navbar />
      <main className="max-w-lg mx-auto p-6 bg-neutral-900 rounded">
        <h1 className="text-2xl font-bold mb-4">Editar Perfil</h1>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Nombre</label>
            <input value={firstName} onChange={e=>setFirstName(e.target.value)} className="w-full bg-neutral-800 px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block text-sm mb-1">Apellido</label>
            <input value={lastName} onChange={e=>setLastName(e.target.value)} className="w-full bg-neutral-800 px-3 py-2 rounded" />
          </div>
          <button type="submit" disabled={saving} className="w-full py-2 bg-red-700 rounded disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
          {saved && <p className="text-green-400 text-sm">Guardado.</p>}
        </form>
        <div className="mt-8 text-sm text-neutral-400">Funciones adicionales (email, avatar) se agregarán en fases posteriores.</div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfileEditPage;