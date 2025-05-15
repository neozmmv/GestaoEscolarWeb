import mysql from 'mysql2/promise';

export async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST as string,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_NAME as string,
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