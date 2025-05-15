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

export default function MonitoresPage() {
  const [monitores, setMonitores] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchMonitores = async () => {
      try {
        const response = await fetch('/api/monitores');
        if (!response.ok) {
          throw new Error('Erro ao carregar monitores');
        }
        const data = await response.json();
        setMonitores(data.monitores);
      } catch (err) {
        setError('Erro ao carregar monitores');
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMonitores();
  }, []);

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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CPF
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Perfil
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Escola
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {monitores.map((monitor) => (
              <tr key={monitor.id}>
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
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir este monitor?')) {
                        // Implementar exclusão
                      }
                    }}
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
