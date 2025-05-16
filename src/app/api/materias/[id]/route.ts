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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const connection = await getConnection();

    try {
      // Verificar se a matéria existe e se o usuário tem permissão para excluí-la
      const [materias]: any = await connection.execute(
        'SELECT escola_id FROM materias WHERE id = ?',
        [params.id]
      );

      if (materias.length === 0) {
        await connection.end();
        return NextResponse.json(
          { error: 'Matéria não encontrada' },
          { status: 404 }
        );
      }

      const materia = materias[0];

      // Verificar permissão
      if (user.perfil !== 'admin' && user.escola_id !== materia.escola_id) {
        await connection.end();
        return NextResponse.json(
          { error: 'Você não tem permissão para excluir esta matéria' },
          { status: 403 }
        );
      }

      // Verificar se a matéria está sendo usada em observações
      const [observacoes]: any = await connection.execute(
        'SELECT id FROM observacoes WHERE disciplina = (SELECT nome FROM materias WHERE id = ?)',
        [params.id]
      );

      if (observacoes.length > 0) {
        await connection.end();
        return NextResponse.json(
          { error: 'Não é possível excluir esta matéria pois ela está sendo usada em observações' },
          { status: 400 }
        );
      }

      // Excluir a matéria
      await connection.execute('DELETE FROM materias WHERE id = ?', [params.id]);

      await connection.end();
      return NextResponse.json({ message: 'Matéria excluída com sucesso' });
    } catch (error) {
      await connection.end();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 