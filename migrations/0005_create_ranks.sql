CREATE TABLE ranks (
  level      integer PRIMARY KEY,
  name       text NOT NULL,
  min_points integer NOT NULL
);

INSERT INTO ranks (level, name, min_points) VALUES
  (1, 'Recluta', 0),
  (2, 'Soldado', 20),
  (3, 'Veterano', 60),
  (4, 'Élite', 120),
  (5, 'Legendario', 200);

ALTER TABLE user_factions
  ADD CONSTRAINT user_factions_rank_fkey FOREIGN KEY (rank) REFERENCES ranks(level);
