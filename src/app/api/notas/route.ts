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
  let connection;
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { aluno_id, materia_id, data, valor } = await request.json();

    // Validate required fields
    if (!aluno_id || !materia_id || !data || valor === undefined) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    connection = await getConnection();

    // Antes de inserir a nota, verifique:
    let alunos;
    if (user.perfil === 'admin') {
      [alunos] = await connection.execute(
        'SELECT id, escola_id FROM alunos WHERE id = ?',
        [aluno_id]
      );
    } else {
      [alunos] = await connection.execute(
        'SELECT id, escola_id FROM alunos WHERE id = ? AND escola_id = ?',
        [aluno_id, user.escola_id]
      );
    }

    if (alunos.length === 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'Aluno não encontrado ou não pertence à sua escola' },
        { status: 404 }
      );
    }

    const escolaIdDoAluno = alunos[0].escola_id;

    // Insert the grade into the notas table
    await connection.execute(
      'INSERT INTO notas (aluno_id, materia_id, escola_id, valor) VALUES (?, ?, ?, ?)',
      [aluno_id, materia_id, escolaIdDoAluno, valor]
    );

    console.log({
      aluno_id: aluno_id,
      materia_id: materia_id,
      escola_id: escolaIdDoAluno,
      data: data,
      valor: valor,
    });

    return NextResponse.json({ message: 'Nota adicionada com sucesso' });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar nota. Por favor, tente novamente.' },
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

export async function GET(request: Request) {
  let connection;
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const aluno_id = searchParams.get('aluno_id');

    if (!aluno_id) {
      return NextResponse.json(
        { error: 'aluno_id é obrigatório' },
        { status: 400 }
      );
    }

    connection = await getConnection();

    let rows;
    if (user.perfil === 'admin') {
      // Admin vê todas as notas do aluno, independente da escola
      [rows] = await connection.execute(
        'SELECT id, materia_id, valor, data FROM notas WHERE aluno_id = ?',
        [aluno_id]
      );
    } else {
      // Monitor/professor só vê notas da sua escola
      [rows] = await connection.execute(
        'SELECT id, materia_id, valor, data FROM notas WHERE aluno_id = ? AND escola_id = ?',
        [aluno_id, user.escola_id]
      );
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Erro ao buscar notas:', error);
    return NextResponse.json({ error: 'Erro ao buscar notas' }, { status: 500 });
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

export async function PUT(request: Request) {
  let connection;
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id, valor } = await request.json();

    if (!id || valor === undefined) {
      return NextResponse.json({ error: 'ID e valor são obrigatórios' }, { status: 400 });
    }

    connection = await getConnection();

    // Verificar permissão
    let notas;
    if (user.perfil === 'admin') {
      [notas] = await connection.execute('SELECT * FROM notas WHERE id = ?', [id]);
    } else {
      [notas] = await connection.execute(
        'SELECT * FROM notas WHERE id = ? AND escola_id = ?',
        [id, user.escola_id]
      );
    }

    if (notas.length === 0) {
      await connection.end();
      return NextResponse.json({ error: 'Nota não encontrada ou não pertence à sua escola' }, { status: 404 });
    }

    await connection.execute('UPDATE notas SET valor = ? WHERE id = ?', [valor, id]);
    await connection.end();

    return NextResponse.json({ message: 'Nota atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar nota:', error);
    return NextResponse.json({ error: 'Erro ao atualizar nota' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function DELETE(request: Request) {
  let connection;
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da nota é obrigatório' }, { status: 400 });
    }

    connection = await getConnection();

    // Verificar permissão
    let notas;
    if (user.perfil === 'admin') {
      [notas] = await connection.execute('SELECT * FROM notas WHERE id = ?', [id]);
    } else {
      [notas] = await connection.execute(
        'SELECT * FROM notas WHERE id = ? AND escola_id = ?',
        [id, user.escola_id]
      );
    }

    if (notas.length === 0) {
      await connection.end();
      return NextResponse.json({ error: 'Nota não encontrada ou não pertence à sua escola' }, { status: 404 });
    }

    await connection.execute('DELETE FROM notas WHERE id = ?', [id]);
    await connection.end();

    return NextResponse.json({ message: 'Nota excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir nota:', error);
    return NextResponse.json({ error: 'Erro ao excluir nota' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}