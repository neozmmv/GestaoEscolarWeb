'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Student {
  id: number;
  nome: string;
  numero: string;
  turma: string;
  ano_letivo: string;
  escola_nome: string;
}

interface School {
  id: number;
  nome: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [searchBy, setSearchBy] = useState('Nome');
  const [searchText, setSearchText] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    numero: '',
    turma: '',
    ano_letivo: '',
    escola_id: '',
  });

  useEffect(() => {
    fetchStudents();
    fetchSchools();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        searchBy,
        searchText,
        ...(selectedSchool && { escolaId: selectedSchool }),
      });

      const response = await fetch(`/api/alunos?${params}`);
      if (!response.ok) throw new Error('Erro ao carregar alunos');

      const data = await response.json();
      setStudents(data.students);
    } catch (err) {
      setError('Erro ao carregar alunos');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/escolas');
      if (!response.ok) throw new Error('Erro ao carregar escolas');
      const data = await response.json();
      setSchools(data.schools);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingStudent ? '/api/alunos' : '/api/alunos';
      const method = editingStudent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingStudent?.id,
        }),
      });

      if (!response.ok) throw new Error('Erro ao salvar aluno');

      setIsModalOpen(false);
      setEditingStudent(null);
      setFormData({
        nome: '',
        numero: '',
        turma: '',
        ano_letivo: '',
        escola_id: '',
      });
      fetchStudents();
    } catch (err) {
      setError('Erro ao salvar aluno');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) return;

    try {
      const response = await fetch(`/api/alunos?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao excluir aluno');

      fetchStudents();
    } catch (err) {
      setError('Erro ao excluir aluno');
      console.error(err);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      nome: student.nome,
      numero: student.numero,
      turma: student.turma,
      ano_letivo: student.ano_letivo,
      escola_id: student.escola_nome,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Alunos</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Buscar por</label>
          <select
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="ID">ID</option>
            <option value="Nome">Nome</option>
            <option value="Número">Número</option>
            <option value="Turma">Turma</option>
            <option value="Ano Letivo">Ano Letivo</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Termo de busca</label>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Digite para buscar..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Escola</label>
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Todas as Escolas</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.nome}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Buscar
        </button>

        <button
          type="button"
          onClick={() => {
            setSearchText('');
            setSelectedSchool('');
            fetchStudents();
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Limpar
        </button>
      </form>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <button
            onClick={() => {
              setEditingStudent(null);
              setFormData({
                nome: '',
                numero: '',
                turma: '',
                ano_letivo: '',
                escola_id: '',
              });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Cadastrar Novo Aluno
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
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ano Letivo
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
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{student.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{student.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{student.numero}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{student.turma}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{student.ano_letivo}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{student.escola_nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(student)}
                      className="text-blue-500 hover:text-blue-700 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
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
              {editingStudent ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}
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
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Número</label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Turma</label>
                <input
                  type="text"
                  value={formData.turma}
                  onChange={(e) => setFormData({ ...formData, turma: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Ano Letivo</label>
                <input
                  type="text"
                  value={formData.ano_letivo}
                  onChange={(e) => setFormData({ ...formData, ano_letivo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Escola</label>
                <select
                  value={formData.escola_id}
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
                  {editingStudent ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
