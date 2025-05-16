import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { useRouter } from 'next/navigation';

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

export async function GET(request: Request) {
  let connection;
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    connection = await getConnection();

    let rows;
    if (user.perfil === 'admin') {
      // Admin vê todas as matérias de todas as escolas
      [rows] = await connection.execute(
        'SELECT id, nome, escola_id FROM materias ORDER BY nome',
        []
      );
    } else {
      // Monitor/professor vê apenas matérias da sua escola
      [rows] = await connection.execute(
        'SELECT id, nome, escola_id FROM materias WHERE escola_id = ? ORDER BY nome',
        [user.escola_id]
      );
    }

    rows = rows.map((row: any) => ({
      ...row,
      escola_id: Number(row.escola_id),
    }));

    await connection.end();
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Erro ao buscar matérias:', error);
    return NextResponse.json({ error: 'Erro ao buscar matérias' }, { status: 500 });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (err) {
        console.error('Erro ao fechar conexão:', err);
      }
    }
  }
}

export async function POST(request: Request) {
  let connection;
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { nome, escola_id } = await request.json();
    if (!nome || !escola_id) {
      return NextResponse.json(
        { error: 'Nome e escola são obrigatórios' },
        { status: 400 }
      );
    }

    connection = await getConnection();

    if (user.perfil !== 'admin' && user.escola_id !== escola_id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para adicionar matérias nesta escola' },
        { status: 403 }
      );
    }

    const escolaIdNum = Number(escola_id);

    const [escolas]: any = await connection.execute(
      'SELECT id FROM escolas WHERE id = ?',
      [escolaIdNum]
    );

    if (escolas.length === 0) {
      return NextResponse.json(
        { error: 'Escola não encontrada' },
        { status: 404 }
      );
    }

    const [result]: any = await connection.execute(
      'INSERT INTO materias (nome, escola_id) VALUES (?, ?)',
      [nome, escola_id]
    );

    const materiaId = result.insertId;

    await connection.execute(
      'INSERT INTO escolas_materias (escola_id, materia_id) VALUES (?, ?)',
      [escolaIdNum, materiaId]
    );

    return NextResponse.json({ message: 'Matéria adicionada com sucesso' });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar matéria. Por favor, tente novamente.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}
