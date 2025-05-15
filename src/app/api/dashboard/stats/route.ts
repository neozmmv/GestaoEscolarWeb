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

export async function GET() {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const connection = await getConnection();

    let studentsQuery = 'SELECT COUNT(*) as total FROM alunos';
    let monitorsQuery = 'SELECT COUNT(*) as total FROM monitores';
    let schoolsQuery = 'SELECT COUNT(*) as total FROM escolas';

    if (user.perfil !== 'admin') {
      studentsQuery += ' WHERE escola_id = ?';
      monitorsQuery += ' WHERE escola_id = ?';
    }

    const [studentsResult]: any = await connection.execute(
      studentsQuery,
      user.perfil !== 'admin' ? [user.escola_id] : []
    );

    const [monitorsResult]: any = await connection.execute(
      monitorsQuery,
      user.perfil !== 'admin' ? [user.escola_id] : []
    );

    let schoolsResult: any[] = [];
    if (user.perfil === 'admin') {
      [schoolsResult] = await connection.execute(schoolsQuery, []);
    }

    await connection.end();

    return NextResponse.json({
      totalStudents: studentsResult[0].total,
      totalSchools: schoolsResult[0]?.total || 0,
      totalMonitors: monitorsResult[0].total
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 