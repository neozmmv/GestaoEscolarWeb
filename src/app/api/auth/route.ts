import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { cookies } from 'next/headers';
import { sign } from 'jsonwebtoken';
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

// Função para verificar senha no mesmo formato do Werkzeug
function checkPasswordHash(password: string, storedHash: string): boolean {
  console.log("Verificando senha...");
  console.log("Senha fornecida:", password);
  console.log("Hash armazenado:", storedHash);
  
  const parts = storedHash.split('$');
  if (parts.length !== 3) {
    console.log("Formato de hash inválido - número incorreto de partes");
    return false;
  }
  
  const [methodWithIterations, salt, storedHashValue] = parts;
  const methodParts = methodWithIterations.split(':');
  const method = methodParts.slice(0, 2).join(':');
  const iterations = methodParts[2];
  
  console.log("Método:", method);
  console.log("Iterações:", iterations);
  console.log("Salt:", salt);
  console.log("Hash armazenado:", storedHashValue);
  
  if (method !== 'pbkdf2:sha256') {
    console.log("Método de hash não corresponde");
    return false;
  }
  
  // Usar a mesma implementação do Werkzeug para verificar
  const hash = crypto.pbkdf2Sync(
    Buffer.from(password, 'utf8'),
    Buffer.from(salt, 'utf8'),
    parseInt(iterations),
    32,
    'sha256'
  );
  
  const computedHash = `pbkdf2:sha256:${iterations}$${salt}$${hash.toString('hex')}`;
  console.log("Hash computado:", computedHash);
  
  const match = computedHash === storedHash;
  console.log("Senhas correspondem:", match);
  
  return match;
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    console.log("Tentativa de login para usuário:", username);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST as string,
      user: process.env.DB_USER as string,
      password: process.env.DB_PASSWORD as string,
      database: process.env.DB_NAME as string,
    });

    console.log("Conexão com o banco de dados estabelecida");

    // Buscar usuário pelo nome
    const [rows]: any = await connection.execute(
      'SELECT id, nome, cpf, perfil, escola_id, senha FROM monitores WHERE nome = ?',
      [username]
    );

    console.log("Usuário encontrado:", rows.length > 0);

    await connection.end();

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário ou senha inválidos' },
        { status: 401 }
      );
    }

    const user = rows[0];
    
    // Verificar a senha usando o mesmo método do Werkzeug
    const passwordMatch = checkPasswordHash(password, user.senha);
    
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Usuário ou senha inválidos' },
        { status: 401 }
      );
    }

    const token = sign(
      {
        id: user.id,
        nome: user.nome,
        perfil: user.perfil,
        escola_id: user.escola_id,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 1 day
    });

    return NextResponse.json({
      user: {
        id: user.id,
        nome: user.nome,
        perfil: user.perfil,
        escola_id: user.escola_id,
      },
    });
  } catch (error) {
    console.error('Erro detalhado durante o login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}