/**
 * db.js — Supabase PostgreSQL database layer
 *
 * Drop-in replacement for the old better-sqlite3 db.js.
 * Exports async helper functions that the rest of the backend uses.
 *
 * The old module exported a synchronous better-sqlite3 Database instance.
 * This module exports an object with async query helpers backed by the
 * Supabase JS client. All consuming code must use `await`.
 */

const supabase = require("./supabase");

if (!supabase) {
  console.error("❌ Supabase client is not configured. Check SUPABASE_URL and SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

// ────────────────────────────────────────────────────────────
// Core query helpers
// ────────────────────────────────────────────────────────────

/**
 * Fetch all rows from a table with optional filters.
 * Returns an array of row objects.
 */
async function selectAll(table, { columns = "*", filters = {}, order, ilike, orFilter, rawQuery } = {}) {
  let query = supabase.from(table).select(columns);
  for (const [col, val] of Object.entries(filters)) {
    query = query.eq(col, val);
  }
  if (ilike) {
    for (const [col, pattern] of Object.entries(ilike)) {
      query = query.ilike(col, pattern);
    }
  }
  if (orFilter) {
    query = query.or(orFilter);
  }
  if (order) {
    for (const o of Array.isArray(order) ? order : [order]) {
      query = query.order(o.column, { ascending: o.ascending !== false, nullsFirst: o.nullsFirst });
    }
  }
  if (rawQuery) {
    query = rawQuery(query);
  }
  const { data, error } = await query;
  if (error) throw new Error(`selectAll(${table}): ${error.message}`);
  return data || [];
}

/**
 * Fetch a single row. Returns the row object or null.
 */
async function selectOne(table, { columns = "*", filters = {}, rawQuery } = {}) {
  let query = supabase.from(table).select(columns);
  for (const [col, val] of Object.entries(filters)) {
    query = query.eq(col, val);
  }
  if (rawQuery) {
    query = rawQuery(query);
  }
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw new Error(`selectOne(${table}): ${error.message}`);
  return data || null;
}

/**
 * Insert a row. Returns the inserted row with its generated id.
 */
async function insertRow(table, row) {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw new Error(`insertRow(${table}): ${error.message}`);
  return data;
}

/**
 * Insert a row, ignoring conflicts (equivalent to INSERT OR IGNORE / ON CONFLICT DO NOTHING).
 * Returns the inserted row or null if it was a conflict.
 */
async function insertIgnore(table, row) {
  const { data, error } = await supabase.from(table).upsert(row, { onConflict: "", ignoreDuplicates: true }).select().maybeSingle();
  if (error) {
    // If it's a unique constraint violation, treat it as "ignored"
    if (error.code === "23505") return null;
    throw new Error(`insertIgnore(${table}): ${error.message}`);
  }
  return data || null;
}

/**
 * Update rows matching filters. Returns the updated rows.
 */
async function updateRows(table, updates, filters = {}) {
  let query = supabase.from(table).update(updates);
  for (const [col, val] of Object.entries(filters)) {
    query = query.eq(col, val);
  }
  const { data, error } = await query.select();
  if (error) throw new Error(`updateRows(${table}): ${error.message}`);
  return data || [];
}

/**
 * Delete rows matching filters. Returns deleted rows.
 */
async function deleteRows(table, filters = {}) {
  let query = supabase.from(table).delete();
  for (const [col, val] of Object.entries(filters)) {
    query = query.eq(col, val);
  }
  const { data, error } = await query.select();
  if (error) throw new Error(`deleteRows(${table}): ${error.message}`);
  return data || [];
}

/**
 * Count rows in a table with optional filters.
 */
async function countRows(table, filters = {}) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  for (const [col, val] of Object.entries(filters)) {
    query = query.eq(col, val);
  }
  const { count, error } = await query;
  if (error) return 0;
  return count || 0;
}

/**
 * Upsert a row (insert or update on conflict).
 * conflictColumns: the column(s) that define the conflict.
 */
async function upsertRow(table, row, conflictColumns) {
  const { data, error } = await supabase
    .from(table)
    .upsert(row, { onConflict: conflictColumns })
    .select()
    .single();
  if (error) throw new Error(`upsertRow(${table}): ${error.message}`);
  return data;
}

// Export the raw supabase client too, for advanced queries
module.exports = {
  supabase,
  selectAll,
  selectOne,
  insertRow,
  insertIgnore,
  updateRows,
  deleteRows,
  countRows,
  upsertRow,
};
