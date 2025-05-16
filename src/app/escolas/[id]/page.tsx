'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditarEscolaPage() {
  const router = useRouter();
  const params = useParams();
  const escolaId = params.id as string;

  const [nome, setNome] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca os dados da escola
    const fetchEscola = async () => {
      try {
        const res = await fetch(`/api/escolas?id=${escolaId}`);
        if (!res.ok) throw new Error('Erro ao buscar escola');
        const data = await res.json();
        setNome(data.nome ?? ''); // <-- Garante string
      } catch (err: any) {
        setError(err.message || 'Erro ao buscar escola');
      } finally {
        setLoading(false);
      }
    };
    fetchEscola();
  }, [escolaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`/api/escolas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: escolaId, nome }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar escola');
      }
      setSuccess(true);
      setTimeout(() => router.push('/escolas'), 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar escola');
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Carregando...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Editar Escola</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Nome da escola</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">Escola atualizada com sucesso!</div>}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Salvar
        </button>
      </form>
    </div>
  );
}
