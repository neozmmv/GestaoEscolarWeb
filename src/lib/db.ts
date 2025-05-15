import mysql from 'mysql2/promise';

export async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

export async function executeQuery<T>(query: string, params: any[] = []): Promise<T> {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(query, params);
    return rows as T;
  } finally {
    await connection.end();
  }
} 