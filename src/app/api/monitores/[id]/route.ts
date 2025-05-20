import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken();
    if (!user || user.perfil !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const connection = await getConnection();
    const { id } = await context.params;
    const [rows]: any = await connection.execute(
      `SELECT m.id, m.nome, m.cpf, m.perfil, m.escola_id 
       FROM monitores m 
       WHERE m.id = ?`,
      [id]
    );

    await connection.end();

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Monitor não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching monitor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken();
    if (!user || user.perfil !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { nome, cpf, perfil, escola_id, senha } = body;

    if (!nome || !cpf || !perfil) {
      return NextResponse.json(
        { error: 'Nome, CPF e perfil são obrigatórios' },
        { status: 400 }
      );
    }

    if (perfil !== 'admin' && !escola_id) {
      return NextResponse.json(
        { error: 'Escola é obrigatória para monitores' },
        { status: 400 }
      );
    }

    const connection = await getConnection();
    const { id } = await context.params;
    // Verificar se o CPF já existe em outro monitor
    const [existingMonitors]: any = await connection.execute(
      'SELECT id FROM monitores WHERE cpf = ? AND id != ?',
      [cpf, id]
    );

    if (existingMonitors.length > 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'CPF já cadastrado para outro monitor' },
        { status: 400 }
      );
    }

    let updateQuery = `
      UPDATE monitores 
      SET nome = ?, cpf = ?, perfil = ?, escola_id = ?
    `;
    const queryParams = [nome, cpf, perfil, perfil === 'admin' ? null : escola_id];

    // Se uma nova senha foi fornecida, adicionar ao update
    if (senha) {
      const hashedPassword = await bcrypt.hash(senha, 10);
      updateQuery += ', senha = ?';
      queryParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    queryParams.push(id);

    await connection.execute(updateQuery, queryParams);
    await connection.end();

    return NextResponse.json({ message: 'Monitor atualizado com sucesso' });
  } catch (error) {
    console.error('Error updating monitor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken();
    if (!user || user.perfil !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const connection = await getConnection();
    const { id } = await context.params;

    // Verificar se o monitor existe
    const [monitor]: any = await connection.execute(
      'SELECT id FROM monitores WHERE id = ?',
      [id]
    );

    if (monitor.length === 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'Monitor não encontrado' },
        { status: 404 }
      );
    }

    // Deletar o monitor
    await connection.execute('DELETE FROM monitores WHERE id = ?', [id]);
    await connection.end();

    return NextResponse.json({ message: 'Monitor deletado com sucesso' });
  } catch (error) {
    console.error('Error deleting monitor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}