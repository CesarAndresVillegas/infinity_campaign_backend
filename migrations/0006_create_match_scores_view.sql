CREATE VIEW match_scores AS
SELECT
  m.id AS match_id,
  m.user_id,
  m.faction_id,
  m.country_code,
  m.base_score
    + (SELECT COUNT(*) FROM match_likes l WHERE l.match_id = m.id)
    + FLOOR(m.views_count / 10) AS score
FROM matches m;
