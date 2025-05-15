'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Monitor {
  id: number;
  nome: string;
  cpf: string;
  perfil: string;
  escola_id: number;
  escola_nome?: string;
}

interface User {
  id: number;
  nome: string;
  perfil: string;
  escola_id: number;
}

export default function MonitoresPage() {
  const [monitores, setMonitores] = useState<Monitor[]>([]);
  const [filteredMonitores, setFilteredMonitores] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Monitor>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const router = useRouter();

  useEffect(() => {
    fetchUser();
    fetchMonitores();
  }, []);

  useEffect(() => {
    if (monitores) {
      filterAndSortMonitores();
    }
  }, [monitores, searchTerm, sortField, sortOrder]);

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

  const fetchMonitores = async () => {
    try {
      const response = await fetch('/api/monitores');
      if (!response.ok) throw new Error('Erro ao carregar monitores');
      const data = await response.json();
      setMonitores(data.monitores || []);
    } catch (err) {
      setError('Erro ao carregar monitores');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortMonitores = () => {
    if (!monitores) return;

    let filtered = [...monitores];

    // Aplicar filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (monitor) =>
          monitor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          monitor.cpf.includes(searchTerm) ||
          monitor.perfil.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (monitor.escola_nome &&
            monitor.escola_nome.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      const aValue = a[sortField] ?? '';
      const bValue = b[sortField] ?? '';

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredMonitores(filtered);
  };

  const handleSort = (field: keyof Monitor) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este monitor?')) return;

    try {
      const response = await fetch(`/api/monitores/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao excluir monitor');

      setMonitores(monitores.filter((monitor) => monitor.id !== id));
    } catch (err) {
      console.error('Erro ao excluir monitor:', err);
      alert('Erro ao excluir monitor');
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
        <h1 className="text-2xl font-bold text-gray-800">Monitores</h1>
        <button
          onClick={() => router.push('/monitores/novo')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Novo Monitor
        </button>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por nome, CPF, perfil ou escola..."
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
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('cpf')}
              >
                CPF {sortField === 'cpf' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('perfil')}
              >
                Perfil {sortField === 'perfil' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('escola_nome')}
              >
                Escola {sortField === 'escola_nome' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMonitores.map((monitor) => (
              <tr key={monitor.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{monitor.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{monitor.nome}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{monitor.cpf}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{monitor.perfil}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{monitor.escola_nome || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => router.push(`/monitores/${monitor.id}`)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(monitor.id)}
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
        {filteredMonitores.length} monitor(es) encontrado(s)
      </div>
    </div>
  );
}
