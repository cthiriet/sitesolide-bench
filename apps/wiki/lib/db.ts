import path from 'node:path';
import type { DatabaseSync, SQLInputValue, StatementSync } from 'node:sqlite';
import { openDatabase } from './schema.mjs';

type Handle = { db: DatabaseSync; statements: Map<string, StatementSync> };

// One connection per process, shared by every route bundle.
const globalForDb = globalThis as typeof globalThis & { __wikiDb?: Handle };

function handle(): Handle {
  if (!globalForDb.__wikiDb) {
    const dataDir = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR ?? './data');
    globalForDb.__wikiDb = { db: openDatabase(dataDir), statements: new Map() };
  }
  return globalForDb.__wikiDb;
}

function prepare(sql: string): StatementSync {
  const { db, statements } = handle();
  let statement = statements.get(sql);
  if (!statement) {
    statement = db.prepare(sql);
    statements.set(sql, statement);
  }
  return statement;
}

export function all<T>(sql: string, ...params: SQLInputValue[]): T[] {
  return prepare(sql).all(...params) as unknown as T[];
}

export function get<T>(sql: string, ...params: SQLInputValue[]): T | undefined {
  return prepare(sql).get(...params) as unknown as T | undefined;
}

export function run(sql: string, ...params: SQLInputValue[]): { lastInsertRowid: number } {
  const result = prepare(sql).run(...params);
  return { lastInsertRowid: Number(result.lastInsertRowid) };
}

/** Runs fn inside a write transaction; rolls back if it throws. */
export function transaction<T>(fn: () => T): T {
  const { db } = handle();
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export const now = () => Math.floor(Date.now() / 1000);
