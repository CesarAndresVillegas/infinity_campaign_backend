import { getDb } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";

export type MatchResult = "win" | "draw" | "loss";

const RESULT_SCORE: Record<MatchResult, number> = {
  win: 3,
  draw: 1,
  loss: 0,
};

export interface Match {
  id: string;
  user_id: string;
  faction_id: string;
  country_code: string;
  opponent_user_id: string | null;
  opponent_faction_id: string;
  result: MatchResult;
  base_score: number;
  text: string | null;
  views_count: number;
  created_at: string;
}

export interface MatchWithLikes extends Match {
  likes_count: number;
}

export interface CreateMatchInput {
  userId: string;
  factionId: string;
  countryCode: string;
  opponentUserId?: string | null;
  opponentFactionId: string;
  result: MatchResult;
  text?: string | null;
  imageUrls?: string[];
}

export async function createMatch(input: CreateMatchInput): Promise<Match> {
  const sql = getDb();
  const baseScore = RESULT_SCORE[input.result];

  const rows = await sql`
    insert into matches (user_id, faction_id, country_code, opponent_user_id, opponent_faction_id, result, base_score, text)
    values (${input.userId}, ${input.factionId}, ${input.countryCode}, ${input.opponentUserId ?? null}, ${input.opponentFactionId}, ${input.result}, ${baseScore}, ${input.text ?? null})
    returning *
  `;
  const match = rows[0] as Match;

  if (input.imageUrls?.length) {
    for (const [index, url] of input.imageUrls.entries()) {
      await sql`insert into match_images (match_id, url, sort_order) values (${match.id}, ${url}, ${index})`;
    }
  }

  return match;
}

export async function listMatches(limit: number, offset: number): Promise<MatchWithLikes[]> {
  const sql = getDb();
  return (await sql`
    select m.*, (select count(*) from match_likes l where l.match_id = m.id)::int as likes_count
    from matches m
    order by m.created_at desc
    limit ${limit} offset ${offset}
  `) as MatchWithLikes[];
}

export async function listUserMatches(userId: string, limit: number, offset: number): Promise<MatchWithLikes[]> {
  const sql = getDb();
  return (await sql`
    select m.*, (select count(*) from match_likes l where l.match_id = m.id)::int as likes_count
    from matches m
    where m.user_id = ${userId}
    order by m.created_at desc
    limit ${limit} offset ${offset}
  `) as MatchWithLikes[];
}

export interface MatchImage {
  id: string;
  url: string;
  sort_order: number;
}

export async function getMatchById(id: string): Promise<MatchWithLikes & { images: MatchImage[] }> {
  const sql = getDb();
  const rows = await sql`
    select m.*, (select count(*) from match_likes l where l.match_id = m.id)::int as likes_count
    from matches m
    where m.id = ${id}
  `;
  if (rows.length === 0) throw new HttpError(404, "Match not found");
  const images = (await sql`
    select id, url, sort_order from match_images where match_id = ${id} order by sort_order
  `) as MatchImage[];
  return { ...(rows[0] as MatchWithLikes), images };
}

export async function getMatchOwner(id: string): Promise<string | null> {
  const sql = getDb();
  const rows = await sql`select user_id from matches where id = ${id}`;
  return (rows[0] as { user_id: string } | undefined)?.user_id ?? null;
}

export async function deleteMatch(matchId: string, userId: string): Promise<void> {
  const ownerId = await getMatchOwner(matchId);
  if (!ownerId) throw new HttpError(404, "Match not found");
  if (ownerId !== userId) throw new HttpError(403, "You can only delete your own matches");
  const sql = getDb();
  await sql`delete from matches where id = ${matchId}`;
}

export async function likeMatch(matchId: string, userId: string): Promise<void> {
  const sql = getDb();
  const ownerId = await getMatchOwner(matchId);
  if (!ownerId) throw new HttpError(404, "Match not found");
  if (ownerId === userId) throw new HttpError(400, "You cannot like your own match");
  await sql`
    insert into match_likes (match_id, user_id) values (${matchId}, ${userId})
    on conflict do nothing
  `;
}

export async function unlikeMatch(matchId: string, userId: string): Promise<void> {
  const sql = getDb();
  await sql`delete from match_likes where match_id = ${matchId} and user_id = ${userId}`;
}

export async function addView(matchId: string): Promise<void> {
  const sql = getDb();
  await sql`update matches set views_count = views_count + 1 where id = ${matchId}`;
}
