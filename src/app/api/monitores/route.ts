import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Função para gerar hash no mesmo formato do Werkzeug
function generatePasswordHash(password: string, salt: string = ''): string {
  const iterations = 600000;
  const keylen = 32;
  const digest = 'sha256';
  
  // Gerar salt se não fornecido
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  
  // Usar a mesma implementação do Werkzeug
  const hash = crypto.pbkdf2Sync(
    Buffer.from(password, 'utf8'),
    Buffer.from(actualSalt, 'utf8'),
    iterations,
    keylen,
    digest
  );
  
  return `pbkdf2:sha256:${iterations}$${actualSalt}$${hash.toString('hex')}`;
}

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

export async function GET() {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const connection = await getConnection();

    let query = `
      SELECT m.id, m.nome, m.cpf, m.perfil, m.escola_id, e.nome as escola_nome 
      FROM monitores m
      LEFT JOIN escolas e ON m.escola_id = e.id
    `;
    
    if (user.perfil !== 'admin') {
      query += ' WHERE m.escola_id = ?';
    }
    
    query += ' ORDER BY m.nome';

    const [rows] = await connection.execute(
      query,
      user.perfil !== 'admin' ? [user.escola_id] : []
    );

    await connection.end();

    return NextResponse.json({ monitores: rows });
  } catch (error) {
    console.error('Error fetching monitors:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
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

    const { nome, cpf, perfil, escola_id, senha } = await request.json();

    if (!nome || !cpf || !perfil || !senha) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    // Gerar hash da senha antes de salvar
    const senhaHash = generatePasswordHash(senha);

    const [result]: any = await connection.execute(
      `INSERT INTO monitores (nome, cpf, perfil, escola_id, senha) 
       VALUES (?, ?, ?, ?, ?)`,
      [nome, cpf, perfil, escola_id, senhaHash]
    );

    await connection.end();

    return NextResponse.json({
      id: result.insertId,
      message: 'Monitor cadastrado com sucesso'
    });
  } catch (error) {
    console.error('Error creating monitor:', error);
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

    const { id, nome, cpf, perfil, escola_id, senha } = await request.json();

    if (!id || !nome || !cpf || !perfil) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    if (senha) {
      // Gerar hash da senha antes de atualizar
      const senhaHash = generatePasswordHash(senha);
      await connection.execute(
        `UPDATE monitores 
         SET nome = ?, cpf = ?, perfil = ?, escola_id = ?, senha = ?
         WHERE id = ?`,
        [nome, cpf, perfil, escola_id, senhaHash, id]
      );
    } else {
      await connection.execute(
        `UPDATE monitores 
         SET nome = ?, cpf = ?, perfil = ?, escola_id = ?
         WHERE id = ?`,
        [nome, cpf, perfil, escola_id, id]
      );
    }

    await connection.end();

    return NextResponse.json({
      message: 'Monitor atualizado com sucesso'
    });
  } catch (error) {
    console.error('Error updating monitor:', error);
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
        { error: 'ID do monitor é obrigatório' },
        { status: 400 }
      );
    }

    const connection = await getConnection();

    await connection.execute(
      'DELETE FROM monitores WHERE id = ?',
      [id]
    );

    await connection.end();

    return NextResponse.json({
      message: 'Monitor excluído com sucesso'
    });
  } catch (error) {
    console.error('Error deleting monitor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 