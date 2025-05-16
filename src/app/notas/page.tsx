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
  escola_nome?: string; // <-- adicione esta linha
}

interface Subject {
  id: number;
  nome: string;
}

interface Grade {
  id: number;
  materia_id: number;
  valor: number;
  data?: string;
}

interface School {
  id: number;
  nome: string;
}

export default function NotasPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [grade, setGrade] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTurma, setSearchTurma] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [editingGradeId, setEditingGradeId] = useState<number | null>(null);
  const [editGradeValue, setEditGradeValue] = useState<number | ''>('');

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user?.perfil === 'admin') {
      fetchSchools();
    }
  }, [user]);

  useEffect(() => {
    if (user?.perfil === 'admin') {
      fetchStudents(selectedSchool ? Number(selectedSchool) : null); // Busca todos se selectedSchool for null
    } else if (user && user.perfil !== 'admin') {
      fetchStudents(user.escola_id);
    }
  }, [user, selectedSchool]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchUser = async () => {
    const res = await fetch('/api/user');
    if (res.ok) {
      setUser(await res.json());
    }
  };

  const fetchSchools = async () => {
    const res = await fetch('/api/escolas');
    if (res.ok) {
      setSchools(await res.json());
    }
  };

  const fetchStudents = async (escolaId?: number | null) => {
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

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/materias');
      if (!response.ok) throw new Error('Erro ao carregar matérias');
      const data = await response.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Erro ao carregar matérias');
      console.error(err);
    }
  };

  const fetchGradesForStudent = async (studentId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notas?aluno_id=${studentId}`);
      if (!response.ok) throw new Error('Erro ao buscar notas');
      const data = await response.json();
      setGrades(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Erro ao buscar notas');
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setSelectedSubject(null);
    setGrade('');
    fetchGradesForStudent(student.id);
  };

  const handleAddGrade = async () => {
    if (selectedStudent === null || selectedSubject === null || grade === '') return;

    try {
      const response = await fetch('/api/notas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aluno_id: selectedStudent.id,
          materia_id: selectedSubject,
          valor: grade,
          data: new Date().toISOString().slice(0, 10),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao adicionar nota');
      }

      setSelectedSubject(null);
      setGrade('');
      fetchGradesForStudent(selectedStudent.id);
      alert('Nota adicionada com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar nota');
      console.error(err);
    }
  };

  const handleEditGrade = async (gradeId: number) => {
    if (editingGradeId === gradeId) {
      // Se já estiver editando este ID, redefine para null
      setEditingGradeId(null);
      setEditGradeValue('');
    } else {
      setEditingGradeId(gradeId);
      const gradeToEdit = grades.find((g) => g.id === gradeId);
      if (gradeToEdit) {
        setEditGradeValue(gradeToEdit.valor);
      }
    }
  };

  const handleUpdateGrade = async (gradeId: number) => {
    if (editGradeValue === '') return;

    try {
      const response = await fetch(`/api/notas/${gradeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valor: editGradeValue,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar nota');
      }

      setEditingGradeId(null);
      setEditGradeValue('');
      if (selectedStudent) {
        fetchGradesForStudent(selectedStudent.id);
      }
      alert('Nota atualizada com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar nota');
      console.error(err);
    }
  };

  const generatePDF = async () => {
    if (!selectedStudent) return;

    try {
      setGeneratingPdf(true);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      // Cabeçalho
      doc.setFontSize(16);
      doc.text('Relatório de Notas', pageWidth / 2, y, { align: 'center' });
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
        y += 10;
      } else {
        y += 3;
      }

      // Notas
      doc.setFontSize(12);
      doc.text('Notas:', margin, y);
      y += 10;

      doc.setFontSize(10);
      if (grades.length === 0) {
        doc.text('Nenhuma nota encontrada.', margin, y);
        y += 7;
      } else {
        grades.forEach((grade, idx) => {
          if (y > 250) {
            doc.addPage();
            y = 20;
          }

          // Cor de fundo: azul se >= 5, vermelho se < 5
          if (Number(grade.valor) >= 5) {
            doc.setFillColor(220, 235, 255); // azul claro
          } else {
            doc.setFillColor(255, 220, 220); // vermelho claro
          }
          doc.rect(margin - 5, y - 5, pageWidth - margin * 2 + 10, 20, 'F');

          const subject = subjects.find((s) => s.id === grade.materia_id);
          doc.text(`Matéria: ${subject ? subject.nome : 'Desconhecida'}`, margin, y);
          y += 7;
          doc.text(`Nota: ${grade.valor}`, margin, y);
          y += 13;
        });
      }

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

      doc.save(`notas_${selectedStudent.nome.replace(/\s+/g, '_')}.pdf`);
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

  // Gere as turmas apenas dos alunos da escola selecionada (ou todas se nenhuma escola for selecionada)
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

  useEffect(() => {
    setSearchTurma('');
  }, [selectedSchool]);

  if (user === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold mb-4">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notas</h1>
      </div>

      {/* Select de escola para admin */}
      {/* {user?.perfil === 'admin' && (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Escola</label>
          <select
            value={selectedSchool || ''}
            onChange={(e) => setSelectedSchool(e.target.value ? Number(e.target.value) : null)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Selecione uma escola</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.nome}
              </option>
            ))}
          </select>
        </div>
      )} */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Painel de Busca */}
        <div className="md:col-span-1 bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Buscar Aluno</h2>

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
                {escolas.map((escola) => (
                  <option key={escola} value={escola}>
                    {escola}
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
            <h3 className="text-sm font-semibold mb-2">Resultados da Busca</h3>
            <div className="max-h-96 overflow-y-auto">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className={`p-2 cursor-pointer hover:bg-gray-100 rounded ${
                    selectedStudent?.id === student.id ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="font-medium">{student.nome}</div>
                  <div className="text-sm text-gray-600">
                    Turma: {student.turma} | Número: {student.numero}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Notas */}
        <div className="md:col-span-2">
          {selectedStudent ? (
            <div className="bg-white shadow-md rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Notas de {selectedStudent.nome}</h2>
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

              {/* Formulário para adicionar nota */}
              <div className="mb-4 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-gray-700">Matéria</label>
                  <select
                    value={selectedSubject || ''}
                    onChange={(e) => setSelectedSubject(Number(e.target.value))}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="">Selecione uma matéria</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-gray-700">Nota</label>
                  <input
                    type="number"
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Digite a nota"
                  />
                </div>
                <button
                  onClick={handleAddGrade}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Adicionar Nota
                </button>
              </div>

              {/* Lista de notas */}
              {loading ? (
                <div className="text-center py-4">Carregando notas...</div>
              ) : grades.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Nenhuma nota encontrada para este aluno.
                </div>
              ) : (
                <div className="space-y-2">
                  {grades.map((grade) => {
                    const subject = subjects.find((s) => s.id === grade.materia_id);
                    const isEditing = editingGradeId === grade.id;
                    return (
                      <div
                        key={grade.id}
                        className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex justify-between items-center"
                      >
                        <span>
                          <span className="font-semibold">
                            {subject ? subject.nome : 'Matéria desconhecida'}
                          </span>
                          {': '}
                          {isEditing ? (
                            <input
                              type="number"
                              value={editGradeValue}
                              onChange={(e) => setEditGradeValue(Number(e.target.value))}
                              className="border rounded px-2 py-1 w-20 ml-2"
                            />
                          ) : (
                            <span className="text-blue-700 font-bold ml-2">{grade.valor}</span>
                          )}
                          {grade.data && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({new Date(grade.data).toLocaleString()})
                            </span>
                          )}
                        </span>
                        <span>
                          {isEditing ? (
                            <>
                              <button
                                className="text-green-600 hover:text-green-800 mr-2"
                                onClick={async () => {
                                  // Salvar edição
                                  try {
                                    const response = await fetch('/api/notas', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ id: grade.id, valor: editGradeValue }),
                                    });
                                    if (!response.ok) {
                                      const data = await response.json();
                                      throw new Error(data.error || 'Erro ao atualizar nota');
                                    }
                                    setEditingGradeId(null);
                                    setEditGradeValue('');
                                    fetchGradesForStudent(selectedStudent!.id);
                                  } catch (err) {
                                    alert('Erro ao atualizar nota');
                                  }
                                }}
                              >
                                Salvar
                              </button>
                              <button
                                className="text-gray-600 hover:text-gray-800"
                                onClick={() => {
                                  setEditingGradeId(null);
                                  setEditGradeValue('');
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
                                  setEditingGradeId(grade.id);
                                  setEditGradeValue(grade.valor);
                                }}
                              >
                                Editar
                              </button>
                              <button
                                className="text-red-600 hover:text-red-800"
                                onClick={async () => {
                                  if (!confirm('Tem certeza que deseja excluir esta nota?')) return;
                                  try {
                                    const response = await fetch(`/api/notas?id=${grade.id}`, {
                                      method: 'DELETE',
                                    });
                                    if (!response.ok) {
                                      const data = await response.json();
                                      throw new Error(data.error || 'Erro ao excluir nota');
                                    }
                                    fetchGradesForStudent(selectedStudent!.id);
                                  } catch (err) {
                                    alert('Erro ao excluir nota');
                                  }
                                }}
                              >
                                Excluir
                              </button>
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg p-4 text-center text-gray-500">
              Selecione um aluno para ver suas notas
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
