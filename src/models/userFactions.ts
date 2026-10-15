import { getDb } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";

export interface UserFaction {
  user_id: string;
  faction_id: string;
  points: number;
  rank: number;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  email: string;
  points: number;
  rank: number;
}

export async function registerUserFaction(userId: string, factionId: string): Promise<UserFaction> {
  const sql = getDb();
  const rows = await sql`
    insert into user_factions (user_id, faction_id)
    values (${userId}, ${factionId})
    on conflict (user_id, faction_id) do nothing
    returning user_id, faction_id, points, rank, created_at
  `;
  if (rows.length === 0) {
    throw new HttpError(409, "Faction already registered for this user");
  }
  return rows[0] as UserFaction;
}

export async function listUserFactions(userId: string): Promise<UserFaction[]> {
  const sql = getDb();
  return (await sql`
    select user_id, faction_id, points, rank, created_at
    from user_factions
    where user_id = ${userId}
  `) as UserFaction[];
}

export async function isMember(userId: string, factionId: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    select 1 from user_factions where user_id = ${userId} and faction_id = ${factionId}
  `;
  return rows.length > 0;
}

export async function getLeaderboard(factionId: string, limit: number): Promise<LeaderboardEntry[]> {
  const sql = getDb();
  return (await sql`
    select uf.user_id, u.email, uf.points, uf.rank
    from user_factions uf
    join users u on u.id = uf.user_id
    where uf.faction_id = ${factionId}
    order by uf.points desc
    limit ${limit}
  `) as LeaderboardEntry[];
}
