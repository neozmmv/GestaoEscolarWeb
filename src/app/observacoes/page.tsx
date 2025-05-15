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

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
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

  const fetchObservations = async (studentId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/observacoes?aluno_id=${studentId}`);
      if (!response.ok) throw new Error('Erro ao carregar observações');
      const data = await response.json();
      setObservations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Erro ao carregar observações');
      console.error(err);
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
    return matchesName && matchesTurma;
  });

  const turmas = Array.from(new Set(students.map((student) => student.turma))).sort();

  if (loading && !selectedStudent) {
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Observações</h1>
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
          <h2 className="text-lg font-semibold mb-4">Buscar Aluno</h2>

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
            >
              <option value="">Todas as turmas</option>
              {turmas.map((turma) => (
                <option key={turma} value={turma}>
                  {turma}
                </option>
              ))}
            </select>
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

        {/* Lista de Observações */}
        <div className="md:col-span-2">
          {selectedStudent ? (
            <div className="bg-white shadow-md rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Observações de {selectedStudent.nome}</h2>
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
                <div className="text-center py-4">Carregando observações...</div>
              ) : observations.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Nenhuma observação encontrada para este aluno.
                </div>
              ) : (
                <div className="space-y-4">
                  {observations.map((observation) => (
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
                          <span className="font-semibold">
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
                          <span className="font-semibold">Consequência:</span>{' '}
                          {observation.consequencia}
                        </p>
                      )}
                    </div>
                  ))}
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
