import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePaymentMethods, useAddPaymentMethod, useDeletePaymentMethod, useSetDefaultPaymentMethod } from '../hooks/usePaymentMethods';

const PaymentMethodsPage: React.FC = () => {
  const { data: methods = [], isLoading, isError } = usePaymentMethods();
  const addMutation = useAddPaymentMethod();
  const delMutation = useDeletePaymentMethod();
  const defMutation = useSetDefaultPaymentMethod();

  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expMonth, setExpMonth] = useState<number | ''>('');
  const [expYear, setExpYear] = useState<number | ''>('');
  const [cvc, setCvc] = useState('');
  const [setDefault, setSetDefault] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !holderName || !expMonth || !expYear || !cvc) return;
    addMutation.mutate({ cardNumber, holderName, expMonth: Number(expMonth), expYear: Number(expYear), cvc, setDefault });
  };

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <Navbar />
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Métodos de Pago</h1>
        <section className="mb-8 bg-neutral-900 p-4 rounded">
          <h2 className="text-lg font-semibold mb-4">Agregar tarjeta</h2>
          <form onSubmit={handleAdd} className="grid gap-3 md:grid-cols-2">
            <input placeholder="Número" value={cardNumber} onChange={e=>setCardNumber(e.target.value)} className="bg-neutral-800 px-3 py-2 rounded col-span-2" />
            <input placeholder="Titular" value={holderName} onChange={e=>setHolderName(e.target.value)} className="bg-neutral-800 px-3 py-2 rounded col-span-2" />
            <input placeholder="Mes" value={expMonth} onChange={e=>setExpMonth(e.target.value as any)} className="bg-neutral-800 px-3 py-2 rounded" />
            <input placeholder="Año" value={expYear} onChange={e=>setExpYear(e.target.value as any)} className="bg-neutral-800 px-3 py-2 rounded" />
            <input placeholder="CVC" value={cvc} onChange={e=>setCvc(e.target.value)} className="bg-neutral-800 px-3 py-2 rounded" />
            <label className="flex items-center gap-2 text-sm col-span-2"><input type="checkbox" checked={setDefault} onChange={e=>setSetDefault(e.target.checked)} /> Usar como principal</label>
            <button type="submit" disabled={addMutation.isPending} className="bg-red-700 hover:bg-red-600 rounded py-2 col-span-2 disabled:opacity-50">{addMutation.isPending ? 'Guardando...' : 'Guardar'}</button>
          </form>
        </section>
        <section className="bg-neutral-900 p-4 rounded">
          <h2 className="text-lg font-semibold mb-4">Tus tarjetas</h2>
          {isLoading && <p>Cargando...</p>}
          {isError && <p className="text-red-400">Error cargando métodos</p>}
          {!isLoading && methods.length === 0 && <p className="text-sm text-neutral-400">No hay tarjetas guardadas.</p>}
          <ul className="space-y-3">
            {methods.map(m => (
              <li key={m.id} className="flex items-center justify-between bg-neutral-800 px-3 py-2 rounded">
                <div className="text-sm">
                  <span className="font-medium">{m.brand} **** {m.last4}</span>
                  <span className="ml-2 text-neutral-400">{m.expMonth}/{m.expYear}</span>
                  {m.default && <span className="ml-2 text-green-400">(Principal)</span>}
                </div>
                <div className="flex gap-2">
                  {!m.default && <button onClick={()=>defMutation.mutate(m.id)} className="text-xs bg-indigo-600 px-2 py-1 rounded">Principal</button>}
                  <button onClick={()=>delMutation.mutate(m.id)} className="text-xs bg-neutral-600 px-2 py-1 rounded">Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentMethodsPage;