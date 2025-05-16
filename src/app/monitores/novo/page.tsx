'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface School {
  id: number;
  nome: string;
}

export default function NovoMonitorPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    perfil: 'monitor',
    escola_id: '',
    senha: '',
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (formData.perfil === 'admin') {
      setFormData((prev) => ({ ...prev, escola_id: '' }));
    }
  }, [formData.perfil]);

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/escolas');
      if (!response.ok) throw new Error('Erro ao carregar escolas');
      const data = await response.json();
      setSchools(data); // <-- Corrija aqui
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await fetch('/api/monitores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          escola_id: formData.perfil === 'admin' ? null : formData.escola_id,
        }),
      });

      if (!response.ok) throw new Error('Erro ao cadastrar monitor');

      router.push('/monitores');
    } catch (err) {
      setError('Erro ao cadastrar monitor');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Cadastrar Novo Monitor</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-800">Nome</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-800">CPF</label>
            <input
              type="text"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-800">Perfil</label>
            <select
              value={formData.perfil}
              onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
              className="w-full px-3 py-2 border rounded-md text-gray-500"
              required
            >
              <option value="monitor">Monitor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {formData.perfil !== 'admin' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-800">Escola</label>
              <select
                value={formData.escola_id}
                onChange={(e) => setFormData({ ...formData, escola_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-gray-500"
                required
              >
                <option value="">Selecione uma escola</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-800">Senha</label>
            <input
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          {error && <div className="text-red-500 mb-4">{error}</div>}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/monitores')}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
