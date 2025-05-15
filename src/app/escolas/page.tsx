'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface School {
  id: number;
  nome: string;
}

export default function SchoolsPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/escolas');
      if (!response.ok) throw new Error('Erro ao carregar escolas');

      const data = await response.json();
      setSchools(data.schools);
    } catch (err) {
      setError('Erro ao carregar escolas');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSchool ? '/api/escolas' : '/api/escolas';
      const method = editingSchool ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingSchool?.id,
        }),
      });

      if (!response.ok) throw new Error('Erro ao salvar escola');

      setIsModalOpen(false);
      setEditingSchool(null);
      setFormData({ nome: '' });
      fetchSchools();
    } catch (err) {
      setError('Erro ao salvar escola');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta escola?')) return;

    try {
      const response = await fetch(`/api/escolas?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao excluir escola');

      fetchSchools();
    } catch (err) {
      setError('Erro ao excluir escola');
      console.error(err);
    }
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({ nome: school.nome });
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Escolas</h1>

      {/* Schools Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <button
            onClick={() => {
              setEditingSchool(null);
              setFormData({ nome: '' });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Cadastrar Nova Escola
          </button>
        </div>

        {isLoading ? (
          <div className="p-4 text-center">Carregando...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schools.map((school) => (
                <tr key={school.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{school.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{school.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(school)}
                      className="text-blue-500 hover:text-blue-700 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(school.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingSchool ? 'Editar Escola' : 'Cadastrar Nova Escola'}
            </h2>
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
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {editingSchool ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
