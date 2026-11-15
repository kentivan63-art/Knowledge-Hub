import { env } from "cloudflare:workers";

/**
 * Execute a D1 query with optional bound parameters.
 * Returns the full result object.
 */
export async function query(sql, params = []) {
  let stmt = env.DB.prepare(sql);
  if (params.length > 0) {
    stmt = stmt.bind(...params);
  }
  return await stmt.all();
}

/**
 * Execute a D1 query and return the first row, or null.
 */
export async function queryOne(sql, params = []) {
  let stmt = env.DB.prepare(sql);
  if (params.length > 0) {
    stmt = stmt.bind(...params);
  }
  return await stmt.first();
}

/**
 * Execute a D1 query that modifies data (INSERT, UPDATE, DELETE).
 * Returns the result with meta info (last_row_id, changes, etc.)
 */
export async function execute(sql, params = []) {
  let stmt = env.DB.prepare(sql);
  if (params.length > 0) {
    stmt = stmt.bind(...params);
  }
  return await stmt.run();
}

/**
 * Execute multiple D1 queries in a batch (single transaction).
 * Pass an array of { sql, params } objects.
 */
export async function batch(queries) {
  const stmts = queries.map(({ sql, params = [] }) => {
    let stmt = env.DB.prepare(sql);
    if (params.length > 0) stmt = stmt.bind(...params);
    return stmt;
  });
  return await env.DB.batch(stmts);
}
