CREATE TABLE factions (
  id       text PRIMARY KEY,
  name     text NOT NULL,
  logo_url text
);

CREATE TABLE countries (
  code                text PRIMARY KEY,
  name                text NOT NULL,
  dominant_faction_id text REFERENCES factions(id),
  last_updated_at     timestamptz
);

CREATE TABLE users (
  id         uuid PRIMARY KEY,
  email      text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_factions (
  user_id    uuid NOT NULL REFERENCES users(id),
  faction_id text NOT NULL REFERENCES factions(id),
  points     integer NOT NULL DEFAULT 0,
  rank       integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, faction_id)
);

CREATE INDEX idx_user_factions_leaderboard ON user_factions (faction_id, points DESC);

CREATE TABLE matches (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL,
  faction_id          text NOT NULL,
  country_code        text NOT NULL REFERENCES countries(code),
  opponent_user_id    uuid REFERENCES users(id),
  opponent_faction_id text NOT NULL REFERENCES factions(id),
  result              text NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
  base_score          integer NOT NULL,
  text                text,
  views_count         integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id, faction_id) REFERENCES user_factions(user_id, faction_id),
  CHECK (opponent_user_id IS DISTINCT FROM user_id)
);

CREATE INDEX idx_matches_country_faction ON matches (country_code, faction_id);
CREATE INDEX idx_matches_user_history ON matches (user_id, created_at DESC);
CREATE INDEX idx_matches_feed ON matches (created_at DESC);

CREATE TABLE match_images (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id   uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  url        text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX idx_match_images_match ON match_images (match_id);

CREATE TABLE match_likes (
  match_id   uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id, user_id)
);

CREATE TABLE forum_threads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faction_id      text NOT NULL REFERENCES factions(id),
  author_user_id  uuid NOT NULL,
  title           text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (author_user_id, faction_id) REFERENCES user_factions(user_id, faction_id)
);

CREATE INDEX idx_forum_threads_faction ON forum_threads (faction_id, created_at DESC);

CREATE TABLE forum_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id       uuid NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  faction_id      text NOT NULL REFERENCES factions(id),
  author_user_id  uuid NOT NULL,
  text            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (author_user_id, faction_id) REFERENCES user_factions(user_id, faction_id)
);

CREATE INDEX idx_forum_posts_thread ON forum_posts (thread_id, created_at);
