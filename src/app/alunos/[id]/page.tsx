'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Student {
  id: number;
  nome: string;
  numero: string;
  turma: string;
  ano_letivo: number;
}

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Student>({
    id: 0,
    nome: '',
    numero: '',
    turma: '',
    ano_letivo: new Date().getFullYear(),
  });

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/alunos?id=${params.id}`);
        if (!response.ok) throw new Error('Erro ao carregar aluno');
        const data = await response.json();
        // Se o backend retorna um array, pegue o primeiro elemento:
        const aluno = Array.isArray(data) ? data[0] : data;
        setFormData({
          id: aluno.id ?? 0,
          nome: aluno.nome ?? '',
          numero: aluno.numero ?? '',
          turma: aluno.turma ?? '',
          ano_letivo: aluno.ano_letivo ?? new Date().getFullYear(),
        });
      } catch (err) {
        setError('Erro ao carregar aluno');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchStudent();
    }
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        id: formData.id || params.id, // garante que o id vai no corpo
      };

      const response = await fetch(`/api/alunos?id=${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar aluno');
      }

      router.push('/alunos');
    } catch (err) {
      setError('Erro ao atualizar aluno');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold mb-4">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Editar Aluno</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Nome</label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Número</label>
          <input
            type="text"
            value={formData.numero}
            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Turma</label>
          <input
            type="text"
            value={formData.turma}
            onChange={(e) => setFormData({ ...formData, turma: e.target.value })}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Ano Letivo</label>
          <input
            type="number"
            value={formData.ano_letivo}
            onChange={(e) => setFormData({ ...formData, ano_letivo: parseInt(e.target.value) })}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
