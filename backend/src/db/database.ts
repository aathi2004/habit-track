import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

let sqlInstance: any = null;
let dbInstance: SqlJsDatabase | null = null;

const dbPath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : (process.env.DATABASE_PATH || path.join(__dirname, '../../habits.db'));

function saveToDisk() {
  if (dbPath !== ':memory:' && dbInstance) {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, buffer);
  }
}

export class StatementWrapper {
  private sql: string;

  constructor(sql: string) {
    this.sql = sql;
  }

  public get(...params: any[]): any {
    if (!dbInstance) throw new Error('Database not initialized');
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const stmt = dbInstance.prepare(this.sql);
    try {
      stmt.bind(flatParams);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        return row;
      }
      return undefined;
    } finally {
      stmt.free();
    }
  }

  public all(...params: any[]): any[] {
    if (!dbInstance) throw new Error('Database not initialized');
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const stmt = dbInstance.prepare(this.sql);
    const results: any[] = [];
    try {
      stmt.bind(flatParams);
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      return results;
    } finally {
      stmt.free();
    }
  }

  public run(...params: any[]): { lastInsertRowid: number; changes: number } {
    if (!dbInstance) throw new Error('Database not initialized');
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    
    // Get initial changes count
    const initialChanges = dbInstance.getRowsModified();
    
    dbInstance.run(this.sql, flatParams);
    
    const newChanges = dbInstance.getRowsModified() - initialChanges;
    
    // Get last insert rowid
    const rowIdStmt = dbInstance.prepare('SELECT last_insert_rowid() as id');
    let lastInsertRowid = 0;
    try {
      if (rowIdStmt.step()) {
        lastInsertRowid = Number(rowIdStmt.getAsObject().id);
      }
    } finally {
      rowIdStmt.free();
    }

    saveToDisk();

    return {
      lastInsertRowid,
      changes: newChanges,
    };
  }
}

export const db = {
  exec(sql: string) {
    if (!dbInstance) throw new Error('Database not initialized');
    dbInstance.exec(sql);
    saveToDisk();
  },
  prepare(sql: string) {
    return new StatementWrapper(sql);
  },
};

export async function initDatabase() {
  if (!sqlInstance) {
    sqlInstance = await initSqlJs();
  }

  if (dbPath !== ':memory:' && fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    dbInstance = new sqlInstance.Database(fileBuffer);
  } else {
    dbInstance = new sqlInstance.Database();
  }

  // Enable foreign keys
  dbInstance!.exec('PRAGMA foreign_keys = ON;');

  dbInstance!.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      timezone TEXT NOT NULL DEFAULT 'UTC',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      utc_timestamp TEXT NOT NULL,
      local_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      CONSTRAINT unique_habit_local_date UNIQUE (habit_id, local_date)
    );

    CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
    CREATE INDEX IF NOT EXISTS idx_check_ins_habit_date ON check_ins(habit_id, local_date);
  `);

  saveToDisk();
}

export function closeDatabase() {
  if (dbInstance) {
    saveToDisk();
    dbInstance.close();
    dbInstance = null;
  }
}
