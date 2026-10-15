import { getDb } from "../lib/db.js";

export interface Faction {
  id: string;
  name: string;
  logo_url: string | null;
}

export async function listFactions(): Promise<Faction[]> {
  const sql = getDb();
  return (await sql`select id, name, logo_url from factions order by name`) as Faction[];
}

export async function factionExists(id: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`select 1 from factions where id = ${id}`;
  return rows.length > 0;
}
