'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface School {
  id: number;
  nome: string;
}

export default function EditarMonitorPage() {
  const router = useRouter();
  const params = useParams();
  const monitorId = params.id as string;

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    perfil: 'monitor',
    escola_id: '', // sempre string, nunca undefined ou null
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSchools();
    fetchMonitor();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/escolas');
      if (!response.ok) throw new Error('Erro ao carregar escolas');
      const data = await response.json();
      setSchools(data);
    } catch (err) {
      setError('Erro ao carregar escolas');
    }
  };

  const fetchMonitor = async () => {
    try {
      const response = await fetch(`/api/monitores?id=${monitorId}`);
      if (!response.ok) throw new Error('Erro ao carregar monitor');
      const data = await response.json();
      setFormData({
        nome: data.nome ?? '',
        cpf: data.cpf ?? '',
        perfil: data.perfil ?? 'monitor',
        escola_id: data.escola_id ? String(data.escola_id) : '', // sempre string
      });
    } catch (err) {
      setError('Erro ao carregar monitor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      const response = await fetch(`/api/monitores`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: monitorId,
          ...formData,
          escola_id: formData.perfil === 'admin' ? null : formData.escola_id,
        }),
      });
      if (!response.ok) throw new Error('Erro ao atualizar monitor');
      setSuccess(true);
      setTimeout(() => router.push('/monitores'), 1500);
    } catch (err) {
      setError('Erro ao atualizar monitor');
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Carregando...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Editar Monitor</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">CPF</label>
            <input
              type="text"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Perfil</label>
            <select
              value={formData.perfil}
              onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="monitor">Monitor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          {formData.perfil !== 'admin' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Escola</label>
              <select
                value={formData.escola_id ?? ''}
                onChange={(e) => setFormData({ ...formData, escola_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
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
          {/* <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Senha (deixe em branco para não alterar)</label>
            <input
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div> */}
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {success && <div className="text-green-600 mb-4">Monitor atualizado com sucesso!</div>}
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
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
