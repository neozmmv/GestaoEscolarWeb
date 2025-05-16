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

    // Se for admin, busca todos os alunos de todas as escolas
    // Se não for admin, busca apenas os alunos da escola do monitor
    const [rows]: any = await connection.execute(
      `SELECT alunos.id, alunos.nome, alunos.numero, alunos.turma, alunos.ano_letivo, escolas.nome AS escola_nome
      FROM alunos
      JOIN escolas ON alunos.escola_id = escolas.id
      ${user.perfil !== 'admin' ? 'WHERE alunos.escola_id = ?' : ''} 
      ORDER BY escolas.nome, alunos.nome`,
      user.perfil !== 'admin' ? [user.escola_id] : []
    );

    await connection.end();

    return NextResponse.json(rows);
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

    // Determinar o escola_id a ser usado
    const escolaIdToUse = user.perfil === 'admin' ? escola_id : user.escola_id;

    if (!escolaIdToUse) {
      await connection.end();
      return NextResponse.json(
        { error: 'Escola não especificada' },
        { status: 400 }
      );
    }

    // Verificar se já existe um aluno com o mesmo número na escola
    const [existingStudents]: any = await connection.execute(
      'SELECT id FROM alunos WHERE numero = ? AND escola_id = ?',
      [numero, escolaIdToUse]
    );

    if (existingStudents.length > 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'Já existe um aluno com este número nesta escola' },
        { status: 400 }
      );
    }

    // Inserir novo aluno
    const [result]: any = await connection.execute(
      'INSERT INTO alunos (nome, numero, turma, ano_letivo, escola_id) VALUES (?, ?, ?, ?, ?)',
      [nome, numero, turma, ano_letivo, escola_id ?? null]
    );

    await connection.end();

    return NextResponse.json({
      id: result.insertId,
      nome,
      numero,
      turma,
      ano_letivo,
      escola_id: escolaIdToUse,
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

    const { id, nome, numero, turma, ano_letivo } = await request.json();

    if (!id || !nome || !numero || !turma || !ano_letivo) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    // Verificar se o aluno pertence à escola do monitor
    let alunos;
    if (user.perfil === 'admin') {
      [alunos] = await connection.execute('SELECT id, escola_id FROM alunos WHERE id = ?', [
        id,
      ]);
    } else {
      [alunos] = await connection.execute(
        'SELECT id, escola_id FROM alunos WHERE id = ? AND escola_id = ?',
        [id, user.escola_id]
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

    // Verificar se já existe outro aluno com o mesmo número na escola
    const [existingStudents]: any = await connection.execute(
      'SELECT id FROM alunos WHERE numero = ? AND escola_id = ? AND id != ?',
      [numero, escolaIdDoAluno, id]
    );

    if (existingStudents.length > 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'Já existe outro aluno com este número nesta escola' },
        { status: 400 }
      );
    }

    // Atualizar aluno (NÃO altera escola_id)
    await connection.execute(
      'UPDATE alunos SET nome = ?, numero = ?, turma = ?, ano_letivo = ? WHERE id = ?',
      [nome, numero, turma, ano_letivo, id]
    );

    await connection.end();

    return NextResponse.json({
      id,
      nome,
      numero,
      turma,
      ano_letivo,
      escola_id: escolaIdDoAluno, // Corrigido: retorna o escola_id do aluno
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

    // Verificar se o aluno pertence à escola do monitor
    let alunos;
    if (user.perfil === 'admin') {
      [alunos] = await connection.execute('SELECT id FROM alunos WHERE id = ?', [
        id,
      ]);
    } else {
      [alunos] = await connection.execute(
        'SELECT id FROM alunos WHERE id = ? AND escola_id = ?',
        [id, user.escola_id]
      );
    }

    if (alunos.length === 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'Aluno não encontrado ou não pertence à sua escola' },
        { status: 404 }
      );
    }

    // Excluir aluno
    await connection.execute('DELETE FROM alunos WHERE id = ?', [id]);

    await connection.end();

    return NextResponse.json({ message: 'Aluno excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}