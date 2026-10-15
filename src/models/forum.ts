import { getDb } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";

export interface ForumThread {
  id: string;
  faction_id: string;
  author_user_id: string;
  title: string;
  created_at: string;
}

export interface ForumPost {
  id: string;
  thread_id: string;
  faction_id: string;
  author_user_id: string;
  text: string;
  created_at: string;
}

export async function listThreads(factionId: string): Promise<ForumThread[]> {
  const sql = getDb();
  return (await sql`
    select id, faction_id, author_user_id, title, created_at
    from forum_threads
    where faction_id = ${factionId}
    order by created_at desc
  `) as ForumThread[];
}

export async function createThread(factionId: string, authorUserId: string, title: string): Promise<ForumThread> {
  const sql = getDb();
  const rows = await sql`
    insert into forum_threads (faction_id, author_user_id, title)
    values (${factionId}, ${authorUserId}, ${title})
    returning id, faction_id, author_user_id, title, created_at
  `;
  return rows[0] as ForumThread;
}

export async function getThread(threadId: string): Promise<ForumThread> {
  const sql = getDb();
  const rows = await sql`
    select id, faction_id, author_user_id, title, created_at
    from forum_threads
    where id = ${threadId}
  `;
  if (rows.length === 0) throw new HttpError(404, "Thread not found");
  return rows[0] as ForumThread;
}

export async function listPosts(threadId: string): Promise<ForumPost[]> {
  const sql = getDb();
  return (await sql`
    select id, thread_id, faction_id, author_user_id, text, created_at
    from forum_posts
    where thread_id = ${threadId}
    order by created_at asc
  `) as ForumPost[];
}

export async function createPost(
  threadId: string,
  factionId: string,
  authorUserId: string,
  text: string
): Promise<ForumPost> {
  const sql = getDb();
  const rows = await sql`
    insert into forum_posts (thread_id, faction_id, author_user_id, text)
    values (${threadId}, ${factionId}, ${authorUserId}, ${text})
    returning id, thread_id, faction_id, author_user_id, text, created_at
  `;
  return rows[0] as ForumPost;
}
