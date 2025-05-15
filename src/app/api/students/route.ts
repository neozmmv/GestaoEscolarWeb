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
    const searchBy = searchParams.get('searchBy') || 'nome';
    const searchText = searchParams.get('searchText') || '';
    const escolaId = searchParams.get('escolaId');

    const connection = await getConnection();

    let query = `
      SELECT a.id, a.nome, a.numero, a.turma, a.ano_letivo, e.nome as escola_nome 
      FROM alunos a
      JOIN escolas e ON a.escola_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (user.perfil !== 'admin') {
      query += ' AND a.escola_id = ?';
      params.push(user.escola_id);
    } else if (escolaId) {
      query += ' AND a.escola_id = ?';
      params.push(escolaId);
    }

    if (searchText) {
      const columnMap: { [key: string]: string } = {
        'ID': 'a.id',
        'Nome': 'a.nome',
        'Número': 'a.numero',
        'Turma': 'a.turma',
        'Ano Letivo': 'a.ano_letivo'
      };
      const dbColumn = columnMap[searchBy] || 'a.nome';
      query += ` AND ${dbColumn} LIKE ?`;
      params.push(`%${searchText}%`);
    }

    query += ' ORDER BY e.nome, a.nome';

    const [rows] = await connection.execute(query, params);
    await connection.end();

    return NextResponse.json({ students: rows });
  } catch (error) {
    console.error('Error fetching students:', error);
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

    const { nome, numero, turma, ano_letivo, escola_id } = await request.json();

    if (!nome || !numero || !turma || !ano_letivo) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    const [result]: any = await connection.execute(
      `INSERT INTO alunos (nome, numero, turma, ano_letivo, escola_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [nome, numero, turma, ano_letivo, user.perfil === 'admin' ? escola_id : user.escola_id]
    );

    await connection.end();

    return NextResponse.json({
      id: result.insertId,
      message: 'Aluno cadastrado com sucesso'
    });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id, nome, numero, turma, ano_letivo, escola_id } = await request.json();

    if (!id || !nome || !numero || !turma || !ano_letivo) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    await connection.execute(
      `UPDATE alunos 
       SET nome = ?, numero = ?, turma = ?, ano_letivo = ?, escola_id = ?
       WHERE id = ?`,
      [
        nome,
        numero,
        turma,
        ano_letivo,
        user.perfil === 'admin' ? escola_id : user.escola_id,
        id
      ]
    );

    await connection.end();

    return NextResponse.json({
      message: 'Aluno atualizado com sucesso'
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do aluno é obrigatório' },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    await connection.execute(
      'DELETE FROM alunos WHERE id = ?',
      [id]
    );

    await connection.end();

    return NextResponse.json({
      message: 'Aluno excluído com sucesso'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 