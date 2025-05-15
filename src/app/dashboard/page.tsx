'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalStudents: number;
  totalSchools: number;
  totalMonitors: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalSchools: 0,
    totalMonitors: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) throw new Error('Erro ao carregar estatísticas');

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError('Erro ao carregar estatísticas');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold mb-4">Carregando...</div>
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
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Alunos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm">Total de Alunos</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        {/* Card de Escolas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm">Total de Escolas</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.totalSchools}</p>
            </div>
          </div>
        </div>

        {/* Card de Monitores */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm">Total de Monitores</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.totalMonitors}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/alunos')}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-blue-500 mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="font-medium">Novo Aluno</h3>
            <p className="text-sm text-gray-500">Cadastrar um novo aluno</p>
          </button>

          <button
            onClick={() => router.push('/escolas')}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-green-500 mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="font-medium">Nova Escola</h3>
            <p className="text-sm text-gray-500">Cadastrar uma nova escola</p>
          </button>

          <button
            onClick={() => router.push('/monitores')}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-purple-500 mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="font-medium">Novo Monitor</h3>
            <p className="text-sm text-gray-500">Cadastrar um novo monitor</p>
          </button>

          <button
            onClick={() => router.push('/observations')}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-yellow-500 mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="font-medium">Nova Observação</h3>
            <p className="text-sm text-gray-500">Registrar uma nova observação</p>
          </button>
        </div>
      </div>
    </div>
  );
}
