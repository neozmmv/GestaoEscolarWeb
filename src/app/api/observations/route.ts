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
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
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

export async function POST(request: Request) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { aluno_id, data, descricao, tipo } = await request.json();

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

    // Inserir a observação
    await connection.execute(
      'INSERT INTO observacoes (aluno_id, monitor_id, data, descricao, tipo) VALUES (?, ?, ?, ?, ?)',
      [aluno_id, user.id, data, descricao, tipo]
    );

    await connection.end();

    return NextResponse.json({ message: 'Observação registrada com sucesso' });
  } catch (error) {
    console.error('Error registering observation:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}