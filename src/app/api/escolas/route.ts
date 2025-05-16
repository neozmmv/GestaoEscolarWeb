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

export async function GET(request: Request) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const connection = await getConnection();

    let rows;
    if (user.perfil === 'admin') {
      // Admin vê todas as escolas
      [rows] = await connection.execute('SELECT id, nome FROM escolas ORDER BY nome', []);
    } else {
      // Monitor/professor vê apenas sua escola
      [rows] = await connection.execute('SELECT id, nome FROM escolas WHERE id = ?', [user.escola_id]);
    }

    await connection.end();
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar escolas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromToken();
    if (!user || user.perfil !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { nome } = await request.json();

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome da escola é obrigatório' },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    const [result]: any = await connection.execute(
      'INSERT INTO escolas (nome) VALUES (?)',
      [nome]
    );

    await connection.end();

    return NextResponse.json({
      id: result.insertId,
      message: 'Escola cadastrada com sucesso'
    });
  } catch (error) {
    console.error('Error creating school:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromToken();
    if (!user || user.perfil !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id, nome } = await request.json();

    if (!id || !nome) {
      return NextResponse.json(
        { error: 'ID e nome da escola são obrigatórios' },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    await connection.execute(
      'UPDATE escolas SET nome = ? WHERE id = ?',
      [nome, id]
    );

    await connection.end();

    return NextResponse.json({
      message: 'Escola atualizada com sucesso'
    });
  } catch (error) {
    console.error('Error updating school:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromToken();
    if (!user || user.perfil !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da escola é obrigatório' },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    await connection.execute(
      'DELETE FROM escolas WHERE id = ?',
      [id]
    );

    await connection.end();

    return NextResponse.json({
      message: 'Escola excluída com sucesso'
    });
  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}