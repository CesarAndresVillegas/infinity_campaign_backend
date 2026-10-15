import { Pool } from "@neondatabase/serverless";

const SQL = `
-- Recompute points per user+faction from match scores
UPDATE user_factions uf
SET points = sub.total
FROM (
  SELECT user_id, faction_id, SUM(score)::int AS total
  FROM match_scores
  GROUP BY user_id, faction_id
) sub
WHERE uf.user_id = sub.user_id AND uf.faction_id = sub.faction_id;

-- Recompute rank from points, using the ranks table thresholds
UPDATE user_factions uf
SET rank = sub.level
FROM (
  SELECT uf2.user_id, uf2.faction_id, MAX(r.level) AS level
  FROM user_factions uf2
  JOIN ranks r ON r.min_points <= uf2.points
  GROUP BY uf2.user_id, uf2.faction_id
) sub
WHERE uf.user_id = sub.user_id AND uf.faction_id = sub.faction_id;

-- Recompute dominant faction per country
WITH ranked AS (
  SELECT
    country_code,
    faction_id,
    SUM(score) AS total,
    ROW_NUMBER() OVER (PARTITION BY country_code ORDER BY SUM(score) DESC) AS rn
  FROM match_scores
  GROUP BY country_code, faction_id
)
UPDATE countries c
SET dominant_faction_id = r.faction_id,
    last_updated_at = now()
FROM ranked r
WHERE r.rn = 1 AND c.code = r.country_code;
`;

export const handler = async (): Promise<void> => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query(SQL);
  } finally {
    await pool.end();
  }
};
