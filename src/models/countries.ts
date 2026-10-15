import { getDb } from "../lib/db.js";

export interface Country {
  code: string;
  name: string;
  dominant_faction_id: string | null;
  is_active: boolean;
}

export async function listActiveCountries(): Promise<Country[]> {
  const sql = getDb();
  return (await sql`
    select code, name, dominant_faction_id, is_active
    from countries
    where is_active = true
    order by name
  `) as Country[];
}

export async function countryExists(code: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`select 1 from countries where code = ${code} and is_active = true`;
  return rows.length > 0;
}
