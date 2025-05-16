'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Subject {
  id: number;
  nome: string;
  escola_id: number;
  escola_nome: string;
}

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

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [newSubject, setNewSubject] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSchools();
      if (user.perfil === 'admin') {
        // Admin pode ver todas as escolas
        fetchAllSubjects();
      } else {
        // Monitor só vê matérias da sua escola
        fetchSubjectsBySchool(user.escola_id);
        setSelectedSchool(user.escola_id);
      }
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/user');
      if (!response.ok) throw new Error('Erro ao carregar usuário');
      const data = await response.json();
      setUser(data);
    } catch (err) {
      setError('Erro ao carregar usuário');
      console.error(err);
    }
  };

  const fetchSchools = async () => {
    try {
      setError(''); // Clear any previous errors
      const response = await fetch('/api/escolas');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar escolas');
      }

      // Ensure data is an array before setting state
      setSchools(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar escolas';
      setError(errorMessage);
      console.error('Error fetching schools:', err);
      setSchools([]); // Set empty array on error
    }
  };

  const fetchAllSubjects = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const response = await fetch('/api/materias');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar matérias');
      }

      setSubjects(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar matérias';
      setError(errorMessage);
      console.error('Error fetching subjects:', err);
      setSubjects([]); // Clear subjects on error
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectsBySchool = async (schoolId: number) => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const response = await fetch(`/api/materias?escola_id=${schoolId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar matérias');
      }

      setSubjects(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar matérias';
      setError(errorMessage);
      console.error('Error fetching subjects:', err);
      setSubjects([]); // Clear subjects on error
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolChange = (schoolId: number | null) => {
    setSelectedSchool(schoolId);
    if (user?.perfil === 'admin') {
      if (!schoolId) {
        fetchAllSubjects(); // Mostra todas as matérias de todas as escolas
      } else {
        fetchSubjectsBySchool(schoolId);
      }
    } else if (schoolId) {
      fetchSubjectsBySchool(schoolId);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.trim() || !selectedSchool) return;

    try {
      setIsAdding(true);
      const response = await fetch('/api/materias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: newSubject.trim(),
          escola_id: selectedSchool,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao adicionar matéria');
      }

      setNewSubject('');
      setSelectedSchool(null); // <-- Adicione esta linha

      // Recarregar a lista de matérias (todas as escolas)
      if (user?.perfil === 'admin') {
        fetchAllSubjects();
      } else {
        fetchSubjectsBySchool(selectedSchool);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar matéria');
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta matéria?')) return;

    try {
      const response = await fetch(`/api/materias/${subjectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao excluir matéria');
      }

      // Recarregar a lista de matérias
      if (user?.perfil === 'admin') {
        fetchAllSubjects();
      } else {
        fetchSubjectsBySchool(selectedSchool!);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir matéria');
      console.error(err);
    }
  };

  if (loading && !subjects.length) {
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
        <h1 className="text-2xl font-bold text-gray-800">Matérias</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        {/* Seletor de Escola (apenas para admin) */}
        {user?.perfil === 'admin' && (
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Escola</label>
            <select
              value={selectedSchool || ''}
              onChange={(e) => handleSchoolChange(e.target.value ? Number(e.target.value) : null)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Todas as escolas</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Formulário para adicionar matéria */}
        {selectedSchool && (
          <div className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Nome da nova matéria"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <button
                onClick={handleAddSubject}
                disabled={isAdding || !newSubject.trim()}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              >
                {isAdding ? 'Adicionando...' : 'Adicionar Matéria'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de Matérias */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            {user?.perfil === 'admin'
              ? selectedSchool
                ? `Matérias da Escola: ${schools.find((s) => s.id === selectedSchool)?.nome}`
                : 'Selecione uma escola para ver suas matérias'
              : 'Matérias da Escola'}
          </h2>

          {loading ? (
            <div className="text-center py-4 text-gray-800">Carregando matérias...</div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Nenhuma matéria encontrada.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{subject.nome}</h3>
                      {user?.perfil === 'admin' && (
                        <p className="text-sm text-gray-600">Escola: {subject.escola_nome}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
