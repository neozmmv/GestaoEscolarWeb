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

    const { searchParams } = new URL(request.url);
    const escolaId = searchParams.get('escola_id');

    connection = await getConnection();

    let query = `
      SELECT m.*, e.nome as escola_nome 
      FROM materias m 
      JOIN escolas_materias em ON m.id = em.materia_id
      JOIN escolas e ON em.escola_id = e.id
    `;
    let params: any[] = [];

    if (user.perfil !== 'admin') {
      query += ' WHERE em.escola_id = ?';
      params.push(user.escola_id);
    } else if (escolaId) {
      query += ' WHERE em.escola_id = ?';
      params.push(escolaId);
    }

    query += ' ORDER BY m.nome';

    const [rows]: any = await connection.execute(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar matérias. Por favor, tente novamente.' },
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

    const [escolas]: any = await connection.execute(
      'SELECT id FROM escolas WHERE id = ?',
      [escola_id]
    );

    if (escolas.length === 0) {
      return NextResponse.json(
        { error: 'Escola não encontrada' },
        { status: 404 }
      );
    }

    const [result]: any = await connection.execute(
      'INSERT INTO materias (nome) VALUES (?)',
      [nome]
    );

    const materiaId = result.insertId;

    await connection.execute(
      'INSERT INTO escolas_materias (escola_id, materia_id) VALUES (?, ?)',
      [escola_id, materiaId]
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
