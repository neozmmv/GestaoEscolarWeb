import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST as string,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_NAME as string,
  });
}

async function getUserFromToken() {
  const token = cookies().get('token')?.value;
  if (!token) return null;

  try {
    return verify(token, JWT_SECRET) as {
      id: number;
      nome: string;
      perfil: string;
      escola_id: number;
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alunoId = searchParams.get('aluno_id');

    if (!alunoId) {
      return NextResponse.json(
        { error: 'ID do aluno é obrigatório' },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    // Verificar se o aluno pertence à escola do monitor
    const [alunos]: any = await connection.execute(
      'SELECT id FROM alunos WHERE id = ? AND escola_id = ?',
      [alunoId, user.escola_id]
    );

    if (alunos.length === 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'Aluno não encontrado ou não pertence à sua escola' },
        { status: 404 }
      );
    }

    // Buscar observações do aluno
    const [rows]: any = await connection.execute(
      `SELECT o.*, a.nome as aluno_nome, a.turma as aluno_turma 
       FROM observacoes o 
       JOIN alunos a ON o.aluno_id = a.id 
       WHERE o.aluno_id = ? 
       ORDER BY o.data DESC`,
      [alunoId]
    );

    await connection.end();

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching observations:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { aluno_id, data, disciplina, tipo, descricao, consequencia } = await request.json();

    if (!aluno_id || !data || !disciplina || !tipo || !descricao) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    if (tipo !== 'positivo' && tipo !== 'negativo') {
      return NextResponse.json(
        { error: 'Tipo inválido. Deve ser "positivo" ou "negativo"' },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    // Verificar se o aluno pertence à escola do monitor
    const [alunos]: any = await connection.execute(
      'SELECT id FROM alunos WHERE id = ? AND escola_id = ?',
      [aluno_id, user.escola_id]
    );

    if (alunos.length === 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'Aluno não encontrado ou não pertence à sua escola' },
        { status: 404 }
      );
    }

    await connection.execute(
      'INSERT INTO observacoes (aluno_id, data, disciplina, tipo, descricao, consequencia) VALUES (?, ?, ?, ?, ?, ?)',
      [aluno_id, data, disciplina, tipo, descricao, consequencia || null]
    );

    await connection.end();

    return NextResponse.json({ message: 'Observação registrada com sucesso' });
  } catch (error) {
    console.error('Error creating observation:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 