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

    const { searchParams } = new URL(request.url);
    const alunoId = searchParams.get('aluno_id');

    if (!alunoId) {
      return NextResponse.json(
        { error: 'ID do aluno é obrigatório' },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    try {
      // Se for admin, não precisa verificar a escola
      if (user.perfil !== 'admin') {
        // Verificar se o aluno existe e pertence à escola do monitor
    const [alunos]: any = await connection.execute(
      'SELECT id FROM alunos WHERE id = ? AND escola_id = ?',
      [alunoId, user.escola_id]
    );

    if (alunos.length === 0) {
          // Verificar se o aluno existe em outra escola
          const [alunoExiste]: any = await connection.execute(
            'SELECT id FROM alunos WHERE id = ?',
            [alunoId]
          );

          if (alunoExiste.length === 0) {
            await connection.end();
            return NextResponse.json(
              { error: 'Aluno não encontrado' },
              { status: 404 }
            );
          } else {
            await connection.end();
            return NextResponse.json(
              { error: 'Aluno não pertence à sua escola' },
              { status: 403 }
            );
          }
        }
      } else {
        // Para admin, apenas verificar se o aluno existe
        const [alunoExiste]: any = await connection.execute(
          'SELECT id FROM alunos WHERE id = ?',
          [alunoId]
        );

        if (alunoExiste.length === 0) {
      await connection.end();
      return NextResponse.json(
            { error: 'Aluno não encontrado' },
        { status: 404 }
      );
        }
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
      await connection.end();
      throw error;
    }
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

    try {
      // Se for admin, apenas verificar se o aluno existe
      if (user.perfil === 'admin') {
        const [alunoExiste]: any = await connection.execute(
          'SELECT id FROM alunos WHERE id = ?',
          [aluno_id]
        );

        if (alunoExiste.length === 0) {
          await connection.end();
          return NextResponse.json(
            { error: 'Aluno não encontrado' },
            { status: 404 }
          );
        }
      } else {
        // Para não-admin, verificar se o aluno pertence à escola do monitor
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
    }

    await connection.execute(
      'INSERT INTO observacoes (aluno_id, data, disciplina, tipo, descricao, consequencia) VALUES (?, ?, ?, ?, ?, ?)',
      [aluno_id, data, disciplina, tipo, descricao, consequencia || null]
    );

    await connection.end();
    return NextResponse.json({ message: 'Observação registrada com sucesso' });
    } catch (error) {
      await connection.end();
      throw error;
    }
  } catch (error) {
    console.error('Error creating observation:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  let connection;
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id, data, disciplina, tipo, descricao, consequencia } = await request.json();

    if (!id || !data || !disciplina || !tipo || !descricao) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    connection = await getConnection();

    // Verificar permissão
    let obs;
    if (user.perfil === 'admin') {
      [obs] = await connection.execute('SELECT * FROM observacoes WHERE id = ?', [id]);
    } else {
      [obs] = await connection.execute(
        `SELECT o.* FROM observacoes o
         JOIN alunos a ON o.aluno_id = a.id
         WHERE o.id = ? AND a.escola_id = ?`,
        [id, user.escola_id]
      );
    }

    if (obs.length === 0) {
      await connection.end();
      return NextResponse.json({ error: 'Observação não encontrada ou não pertence à sua escola' }, { status: 404 });
    }

    await connection.execute(
      'UPDATE observacoes SET data = ?, disciplina = ?, tipo = ?, descricao = ?, consequencia = ? WHERE id = ?',
      [data, disciplina, tipo, descricao, consequencia || null, id]
    );
    await connection.end();

    return NextResponse.json({ message: 'Observação atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar observação:', error);
    return NextResponse.json({ error: 'Erro ao atualizar observação' }, { status: 500 });
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
      return NextResponse.json({ error: 'ID da observação é obrigatório' }, { status: 400 });
    }

    connection = await getConnection();

    // Verificar permissão
    let obs;
    if (user.perfil === 'admin') {
      [obs] = await connection.execute('SELECT * FROM observacoes WHERE id = ?', [id]);
    } else {
      [obs] = await connection.execute(
        `SELECT o.* FROM observacoes o
         JOIN alunos a ON o.aluno_id = a.id
         WHERE o.id = ? AND a.escola_id = ?`,
        [id, user.escola_id]
      );
    }

    if (obs.length === 0) {
      await connection.end();
      return NextResponse.json({ error: 'Observação não encontrada ou não pertence à sua escola' }, { status: 404 });
    }

    await connection.execute('DELETE FROM observacoes WHERE id = ?', [id]);
    await connection.end();

    return NextResponse.json({ message: 'Observação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir observação:', error);
    return NextResponse.json({ error: 'Erro ao excluir observação' }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}