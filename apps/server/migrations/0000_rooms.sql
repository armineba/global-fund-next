CREATE TABLE IF NOT EXISTS "rooms" (
  "id" text PRIMARY KEY NOT NULL,
  "data" jsonb NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
