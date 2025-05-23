'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf';

interface Student {
  id: number;
  nome: string;
  numero: string;
  turma: string;
  ano_letivo: number;
  escola_id: number;
  escola_nome?: string;
}

interface Observation {
  id: number;
  aluno_id: number;
  data: string;
  disciplina: string;
  tipo: 'positivo' | 'negativo';
  descricao: string;
  consequencia?: string;
}

export default function ObservationsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTurma, setSearchTurma] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [schools, setSchools] = useState<{ id: number; nome: string }[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>(''); // pode ser string ou number, mas usaremos string para o select
  const [user, setUser] = useState<{ perfil: string; escola_id?: number } | null>(null);
  const [editingObservationId, setEditingObservationId] = useState<number | null>(null);
  const [editObservation, setEditObservation] = useState<Partial<Observation>>({});

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user?.perfil === 'admin') {
      fetchSchools();
      fetchAllStudents(); // carrega todos os alunos de todas as escolas
    } else if (user && user.perfil !== 'admin') {
      fetchStudents(user.escola_id);
    }
  }, [user]);

  useEffect(() => {
    setSearchTurma('');
  }, [selectedSchool]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        // Se vier { user: { ... } }
        setUser(data.user ? data.user : data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    }
  };

  const fetchStudents = async (escolaId?: number) => {
    try {
      setLoading(true);
      let url = '/api/alunos';
      if (escolaId) {
        url += `?escola_id=${escolaId}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro ao carregar alunos');
      const data = await response.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Erro ao carregar alunos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/alunos');
      if (!response.ok) throw new Error('Erro ao carregar alunos');
      const data = await response.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Erro ao carregar alunos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/escolas');
      if (!response.ok) throw new Error('Erro ao carregar escolas');
      const data = await response.json();
      setSchools(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar escolas:', err);
    }
  };

  const fetchObservations = async (studentId: number) => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const response = await fetch(`/api/observacoes?aluno_id=${studentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar observações');
      }

      setObservations(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar observações';
      setError(errorMessage);
      console.error('Error fetching observations:', err);
      setObservations([]); // Clear observations on error
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    fetchObservations(student.id);
  };

  const generatePDF = async () => {
    if (!selectedStudent) return;

    try {
      setGeneratingPdf(true);

      // Criar novo documento PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      // Cabeçalho
      doc.setFontSize(16);
      doc.text('Relatório de Observações', pageWidth / 2, y, { align: 'center' });
      y += 20;

      // Informações do Aluno
      doc.setFontSize(12);
      doc.text('Informações do Aluno:', margin, y);
      y += 10;
      doc.setFontSize(10);
      doc.text(`Nome: ${selectedStudent.nome}`, margin, y);
      y += 7;
      doc.text(`Número: ${selectedStudent.numero}`, margin, y);
      y += 7;
      doc.text(`Turma: ${selectedStudent.turma}`, margin, y);
      y += 7;
      doc.text(`Ano Letivo: ${selectedStudent.ano_letivo}`, margin, y);
      y += 7;
      if (selectedStudent.escola_nome) {
        doc.text(`Escola: ${selectedStudent.escola_nome}`, margin, y);
        y += 7;
      }
      y += 10;

      // Observações
      doc.setFontSize(12);
      doc.text('Observações:', margin, y);
      y += 10;

      // Adicionar cada observação
      observations.forEach((obs, index) => {
        // Verificar se precisa de nova página
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(10);
        const data = new Date(obs.data).toLocaleDateString();
        const tipo = obs.tipo === 'positivo' ? 'Positivo' : 'Negativo';

        // Cabeçalho da observação
        doc.setFillColor(obs.tipo === 'positivo' ? '#e6ffe6' : '#ffe6e6');
        doc.rect(margin - 5, y - 5, pageWidth - margin * 2 + 10, 40, 'F');

        doc.text(`Data: ${data}`, margin, y);
        y += 7;
        doc.text(`Disciplina: ${obs.disciplina}`, margin, y);
        y += 7;
        doc.text(`Tipo: ${tipo}`, margin, y);
        y += 7;
        doc.text(`Descrição: ${obs.descricao}`, margin, y);
        y += 7;

        if (obs.consequencia) {
          doc.text(`Consequência: ${obs.consequencia}`, margin, y);
          y += 7;
        }

        y += 10;
      });

      // Rodapé
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Salvar o PDF
      doc.save(`observacoes_${selectedStudent.nome.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setError('Erro ao gerar o relatório em PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesName = student.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTurma = searchTurma === '' || student.turma === searchTurma;
    const matchesEscola = !selectedSchool || student.escola_nome === selectedSchool;
    return matchesName && matchesTurma && matchesEscola;
  });

  const turmas = Array.from(
    new Set(
      students
        .filter((student) => !selectedSchool || student.escola_nome === selectedSchool)
        .map((student) => student.turma)
    )
  ).sort();

  const escolas = Array.from(new Set(students.map((student) => student.escola_nome)))
    .filter(Boolean)
    .sort();

  console.log('user:', user);
  console.log('schools:', schools);

  if (!user || (loading && !selectedStudent)) {
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
        <h1 className="text-2xl font-bold text-gray-800">Observações</h1>
        <button
          onClick={() => router.push('/observacoes/nova')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Nova Observação
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Painel de Busca */}
        <div className="md:col-span-1 bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Buscar Aluno</h2>

          {/* Filtro de escola para admin */}
          {user?.perfil === 'admin' && (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Escola</label>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Todas as escolas</option>
                {schools.map((escola) => (
                  <option key={escola.id} value={escola.nome}>
                    {escola.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Nome</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Digite o nome do aluno"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Turma</label>
            <select
              value={searchTurma}
              onChange={(e) => setSearchTurma(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              disabled={user?.perfil === 'admin' && !selectedSchool}
            >
              <option value="">Todas as turmas</option>
              {turmas.map((turma) => (
                <option key={turma} value={turma}>
                  {turma}
                </option>
              ))}
            </select>
            {user?.perfil === 'admin' && !selectedSchool && (
              <p className="mt-1 text-xs text-gray-500">Selecione uma escola primeiro</p>
            )}
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2 text-gray-800">Resultados da Busca</h3>
            <div className="max-h-96 overflow-y-auto">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className={`p-2 cursor-pointer hover:bg-gray-100 rounded ${
                    selectedStudent?.id === student.id ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="font-medium text-gray-800">{student.nome}</div>
                  <div className="text-sm text-gray-600">
                    Turma: {student.turma} | Número: {student.numero}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Observações */}
        <div className="md:col-span-2">
          {selectedStudent ? (
            <div className="bg-white shadow-md rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Observações de {selectedStudent.nome}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Turma: {selectedStudent.turma} | Número: {selectedStudent.numero}
                  </p>
                </div>
                <button
                  onClick={generatePDF}
                  disabled={generatingPdf}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                >
                  {generatingPdf ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Gerar Relatório
                    </>
                  )}
                </button>
              </div>

              {loading ? (
                <div className="text-center py-4 text-gray-800">Carregando observações...</div>
              ) : observations.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Nenhuma observação encontrada para este aluno.
                </div>
              ) : (
                <div className="space-y-4">
                  {observations.map((observation) => {
                    const isEditing = editingObservationId === observation.id;
                    return (
                      <div
                        key={observation.id}
                        className={`p-4 rounded-lg border ${
                          observation.tipo === 'positivo'
                            ? 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-semibold text-gray-800">
                              {new Date(observation.data).toLocaleDateString()}
                            </span>
                            <span
                              className={`ml-2 px-2 py-1 rounded text-sm ${
                                observation.tipo === 'positivo'
                                  ? 'bg-green-200 text-green-800'
                                  : 'bg-red-200 text-red-800'
                              }`}
                            >
                              {observation.tipo === 'positivo' ? 'Positivo' : 'Negativo'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">{observation.disciplina}</span>
                        </div>
                        <p className="text-gray-700 mb-2">{observation.descricao}</p>
                        {observation.consequencia && (
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold text-gray-800">Consequência:</span>{' '}
                            {observation.consequencia}
                          </p>
                        )}
                        <div className="flex justify-between items-end mt-2">
                          <div>
                            {/* Campos de edição ou visualização */}
                            {isEditing ? (
                              <>
                                <input
                                  type="date"
                                  value={
                                    editObservation.data
                                      ? editObservation.data.slice(0, 10)
                                      : observation.data
                                        ? observation.data.slice(0, 10)
                                        : ''
                                  }
                                  onChange={(e) =>
                                    setEditObservation({ ...editObservation, data: e.target.value })
                                  }
                                  className="border rounded px-2 py-1 mr-2 "
                                />
                                <input
                                  type="text"
                                  value={editObservation.disciplina}
                                  onChange={(e) =>
                                    setEditObservation({
                                      ...editObservation,
                                      disciplina: e.target.value,
                                    })
                                  }
                                  className="border rounded px-2 py-1 mr-2"
                                  placeholder="Disciplina"
                                />
                                <select
                                  value={editObservation.tipo}
                                  onChange={(e) =>
                                    setEditObservation({
                                      ...editObservation,
                                      tipo: e.target.value as 'positivo' | 'negativo',
                                    })
                                  }
                                  className="border rounded px-2 py-1 mr-2"
                                >
                                  <option value="positivo">Positivo</option>
                                  <option value="negativo">Negativo</option>
                                </select>
                                <input
                                  type="text"
                                  value={editObservation.descricao}
                                  onChange={(e) =>
                                    setEditObservation({
                                      ...editObservation,
                                      descricao: e.target.value,
                                    })
                                  }
                                  className="border rounded px-2 py-1 mr-2"
                                  placeholder="Descrição"
                                />
                                <input
                                  type="text"
                                  value={editObservation.consequencia || ''}
                                  onChange={(e) =>
                                    setEditObservation({
                                      ...editObservation,
                                      consequencia: e.target.value,
                                    })
                                  }
                                  className="border rounded px-2 py-1 mr-2"
                                  placeholder="Consequência"
                                />
                              </>
                            ) : (
                              <>
                                <span className="font-semibold text-gray-800">
                                  {new Date(observation.data).toLocaleDateString()}
                                </span>
                                <span className="ml-2 text-sm text-gray-800">
                                  {observation.disciplina}
                                </span>
                                <span className="ml-2 text-sm text-gray-800">
                                  {observation.tipo === 'positivo' ? 'Positivo' : 'Negativo'}
                                </span>
                                <span className="ml-2 text-sm text-gray-800">
                                  {observation.descricao}
                                </span>
                                {observation.consequencia && (
                                  <span className="ml-2 text-sm text-gray-800">
                                    Consequência: {observation.consequencia}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <div>
                            {isEditing ? (
                              <>
                                <button
                                  className="text-green-600 hover:text-green-800 mr-2"
                                  onClick={async () => {
                                    try {
                                      // Se o usuário alterou a data, use a nova, senão use a original
                                      let dataEditada: string;
                                      if (
                                        editObservation.data &&
                                        editObservation.data !== observation.data.slice(0, 10)
                                      ) {
                                        // Se for só a data (YYYY-MM-DD), concatene hora zero
                                        if (/^\d{4}-\d{2}-\d{2}$/.test(editObservation.data)) {
                                          dataEditada = editObservation.data + ' 00:00:00';
                                        } else {
                                          dataEditada = editObservation.data;
                                        }
                                      } else {
                                        // Se o usuário não mexeu, use a data já salva (formato completo)
                                        dataEditada = observation.data;
                                      }

                                      // Validação extra: nunca envie undefined ou string vazia
                                      if (!dataEditada || dataEditada.length < 10) {
                                        alert(
                                          'A data é obrigatória e deve estar no formato YYYY-MM-DD'
                                        );
                                        return;
                                      }

                                      const payload = {
                                        id: observation.id,
                                        data: toMySQLDatetime(dataEditada),
                                        disciplina:
                                          editObservation.disciplina ?? observation.disciplina,
                                        tipo: editObservation.tipo ?? observation.tipo,
                                        descricao:
                                          editObservation.descricao ?? observation.descricao,
                                        consequencia:
                                          editObservation.consequencia ??
                                          observation.consequencia ??
                                          null,
                                      };

                                      console.log('Payload enviado para edição:', payload);

                                      const response = await fetch('/api/observacoes', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(payload),
                                      });
                                      if (!response.ok) {
                                        const data = await response.json();
                                        throw new Error(
                                          data.error || 'Erro ao atualizar observação'
                                        );
                                      }
                                      setEditingObservationId(null);
                                      setEditObservation({});
                                      fetchObservations(selectedStudent!.id);
                                    } catch (err) {
                                      alert('Erro ao atualizar observação');
                                    }
                                  }}
                                >
                                  Salvar
                                </button>
                                <button
                                  className="text-gray-600 hover:text-gray-800"
                                  onClick={() => {
                                    setEditingObservationId(null);
                                    setEditObservation({});
                                  }}
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="text-yellow-600 hover:text-yellow-800 mr-2"
                                  onClick={() => {
                                    setEditingObservationId(observation.id);
                                    setEditObservation(observation);
                                  }}
                                >
                                  Editar
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-800"
                                  onClick={async () => {
                                    if (!confirm('Tem certeza que deseja excluir esta observação?'))
                                      return;
                                    try {
                                      const response = await fetch(
                                        `/api/observacoes?id=${observation.id}`,
                                        {
                                          method: 'DELETE',
                                        }
                                      );
                                      if (!response.ok) {
                                        const data = await response.json();
                                        throw new Error(data.error || 'Erro ao excluir observação');
                                      }
                                      fetchObservations(selectedStudent!.id);
                                    } catch (err) {
                                      alert('Erro ao excluir observação');
                                    }
                                  }}
                                >
                                  Excluir
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg p-4 text-center text-gray-500">
              Selecione um aluno para ver suas observações
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function toMySQLDatetime(dateStr: string) {
  // Se já está no formato correto, retorna
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) return dateStr;
  // Se está no formato ISO, converte
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(dateStr)) {
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  // Se só tem a data, adiciona hora zero
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr + ' 00:00:00';
  return dateStr;
}
