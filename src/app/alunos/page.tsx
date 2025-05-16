'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Student {
  id: number;
  nome: string;
  numero: string;
  turma: string;
  ano_letivo: number;
  escola_nome?: string;
}

interface User {
  id: number;
  nome: string;
  perfil: string;
  escola_id: number;
}

interface Filters {
  search: string;
  turma: string;
  ano_letivo: string;
  escola: string;
}

interface SortConfig {
  key: keyof Student | null;
  direction: 'asc' | 'desc';
}

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    turma: '',
    ano_letivo: '',
    escola: '',
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  });

  useEffect(() => {
    fetchUser();
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [filters, students]);

  const filterStudents = () => {
    let filtered = [...students];

    // Aplicar filtro de busca geral
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((student) => {
        return (
          student.nome.toLowerCase().includes(searchLower) ||
          student.numero.toLowerCase().includes(searchLower) ||
          student.turma.toLowerCase().includes(searchLower) ||
          student.ano_letivo.toString().includes(searchLower) ||
          (student.escola_nome && student.escola_nome.toLowerCase().includes(searchLower))
        );
      });
    }

    // Aplicar filtro de turma
    if (filters.turma) {
      filtered = filtered.filter((student) => student.turma === filters.turma);
    }

    // Aplicar filtro de ano letivo
    if (filters.ano_letivo) {
      filtered = filtered.filter((student) => student.ano_letivo.toString() === filters.ano_letivo);
    }

    // Aplicar filtro de escola (apenas para admin)
    if (filters.escola && user?.perfil === 'admin') {
      filtered = filtered.filter((student) => student.escola_nome === filters.escola);
    }

    setFilteredStudents(filtered);
  };

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/user');
      if (!response.ok) throw new Error('Erro ao carregar informações do usuário');
      const data = await response.json();
      setUser(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/alunos');
      if (!response.ok) throw new Error('Erro ao carregar alunos');
      const data = await response.json();
      setStudents(Array.isArray(data) ? data : []);
      setFilteredStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Erro ao carregar alunos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) return;

    try {
      const response = await fetch(`/api/alunos?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao excluir aluno');

      await fetchStudents();
    } catch (err) {
      setError('Erro ao excluir aluno');
      console.error(err);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      turma: '',
      ano_letivo: '',
      escola: '',
    });
  };

  const handleSort = (key: keyof Student) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedStudents = [...filteredStudents].sort((a, b) => {
      if (a[key] === null) return 1;
      if (b[key] === null) return -1;
      if (a[key] === undefined) return 1;
      if (b[key] === undefined) return -1;

      if (typeof a[key] === 'string' && typeof b[key] === 'string') {
        return direction === 'asc'
          ? a[key].toString().localeCompare(b[key].toString())
          : b[key].toString().localeCompare(a[key].toString());
      }

      return direction === 'asc'
        ? (a[key] as number) - (b[key] as number)
        : (b[key] as number) - (a[key] as number);
    });

    setFilteredStudents(sortedStudents);
  };

  const getSortIcon = (key: keyof Student) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Obter valores únicos para os filtros
  const turmas = Array.from(
    new Set(
      students
        .filter((student) => !filters.escola || student.escola_nome === filters.escola)
        .map((student) => student.turma)
    )
  ).sort();
  const anosLetivos = Array.from(new Set(students.map((student) => student.ano_letivo))).sort();
  const escolas = Array.from(new Set(students.map((student) => student.escola_nome)))
    .filter(Boolean)
    .sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold mb-4 text-gray-800">Carregando...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold text-red-500 mb-4">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Alunos</h1>
        <button
          onClick={() => router.push('/alunos/novo')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Novo Aluno
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Busca Geral */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Busca Geral</label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Buscar por nome ou número..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {filters.search && (
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Filtro de Escola (apenas para admin) */}
          {user?.perfil === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Escola</label>
              <select
                value={filters.escola}
                onChange={(e) => {
                  handleFilterChange('escola', e.target.value);
                  // Limpar o filtro de turma quando mudar a escola
                  handleFilterChange('turma', '');
                }}
                className="text-gray-600 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas as escolas</option>
                {escolas.map((escola) => (
                  <option key={escola} value={escola}>
                    {escola}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro de Turma */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
            <select
              value={filters.turma}
              onChange={(e) => handleFilterChange('turma', e.target.value)}
              className="text-gray-600 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={user?.perfil === 'admin' && !filters.escola}
            >
              <option value="">Todas as turmas</option>
              {turmas.map((turma) => (
                <option key={turma} value={turma}>
                  {turma}
                </option>
              ))}
            </select>
            {user?.perfil === 'admin' && !filters.escola && (
              <p className="mt-1 text-xs text-gray-500">Selecione uma escola primeiro</p>
            )}
          </div>

          {/* Filtro de Ano Letivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano Letivo</label>
            <select
              value={filters.ano_letivo}
              onChange={(e) => handleFilterChange('ano_letivo', e.target.value)}
              className="text-gray-600 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os anos</option>
              {anosLetivos.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botão Limpar Filtros */}
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={clearFilters}
            className="text-gray-600 hover:text-gray-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Limpar Filtros
          </button>
          <p className="text-sm text-gray-500">
            {filteredStudents.length} aluno{filteredStudents.length !== 1 ? 's' : ''} encontrado
            {filteredStudents.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('id')}
              >
                ID {getSortIcon('id')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('nome')}
              >
                Nome {getSortIcon('nome')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('numero')}
              >
                Número {getSortIcon('numero')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('turma')}
              >
                Turma {getSortIcon('turma')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('ano_letivo')}
              >
                Ano Letivo {getSortIcon('ano_letivo')}
              </th>
              {user?.perfil === 'admin' && (
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('escola_nome')}
                >
                  Escola {getSortIcon('escola_nome')}
                </th>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {student.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.numero}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.turma}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.ano_letivo}
                </td>
                {user?.perfil === 'admin' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.escola_nome}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => router.push(`/alunos/${student.id}`)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(student.id)}
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
    </div>
  );
}
