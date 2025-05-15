declare module 'mysql2/promise' {
  export interface Connection {
    execute(sql: string, values: any[]): Promise<any>;
    end(): Promise<void>;
  }

  export function createConnection(config: {
    host: string;
    user: string;
    password: string;
    database: string;
  }): Promise<Connection>;
} 