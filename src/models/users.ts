import { getDb } from "../lib/db.js";

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export async function getUserById(id: string): Promise<User | null> {
  const sql = getDb();
  const rows = await sql`select id, email, created_at from users where id = ${id}`;
  return (rows[0] as User) ?? null;
}

export async function upsertUser(id: string, email: string): Promise<void> {
  const sql = getDb();
  await sql`
    insert into users (id, email) values (${id}, ${email})
    on conflict (id) do nothing
  `;
}
