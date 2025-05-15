'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface School {
  id: number;
  nome: string;
}

interface User {
  id: number;
  nome: string;
  perfil: string;
  escola_id: number;
}

export default function EscolasPage() {
  const [escolas, setEscolas] = useState<School[]>([]);
  const [filteredEscolas, setFilteredEscolas] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof School>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const router = useRouter();

  useEffect(() => {
    fetchUser();
    fetchEscolas();
  }, []);

  useEffect(() => {
    if (escolas) {
      filterAndSortEscolas();
    }
  }, [escolas, searchTerm, sortField, sortOrder]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/user');
      if (!response.ok) throw new Error('Erro ao carregar usuário');
      const data = await response.json();
      setUser(data);
    } catch (err) {
      console.error('Erro ao carregar usuário:', err);
    }
  };

  const fetchEscolas = async () => {
    try {
      const response = await fetch('/api/escolas');
      if (!response.ok) throw new Error('Erro ao carregar escolas');
      const data = await response.json();
      setEscolas(data.escolas || []);
    } catch (err) {
      setError('Erro ao carregar escolas');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortEscolas = () => {
    if (!escolas) return;

    let filtered = [...escolas];

    // Aplicar filtro de busca
    if (searchTerm) {
      filtered = filtered.filter((escola) =>
        escola.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredEscolas(filtered);
  };

  const handleSort = (field: keyof School) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta escola?')) return;

    try {
      const response = await fetch(`/api/escolas/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao excluir escola');

      setEscolas(escolas.filter((escola) => escola.id !== id));
    } catch (err) {
      console.error('Erro ao excluir escola:', err);
      alert('Erro ao excluir escola');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Escolas</h1>
        <button
          onClick={() => router.push('/escolas/novo')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Nova Escola
        </button>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-gray-500 hover:text-gray-700">
            Limpar
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('id')}
              >
                ID {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('nome')}
              >
                Nome {sortField === 'nome' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEscolas.map((escola) => (
              <tr key={escola.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{escola.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{escola.nome}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => router.push(`/escolas/${escola.id}`)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(escola.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        {filteredEscolas.length} escola(s) encontrada(s)
      </div>
    </div>
  );
}
