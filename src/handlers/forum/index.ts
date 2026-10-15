import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { json, parseBody } from "../../lib/http.js";
import { requireAuth } from "../../lib/auth.js";
import { HttpError } from "../../lib/errors.js";
import * as forum from "../../models/forum.js";
import * as userFactions from "../../models/userFactions.js";

export async function listThreads(event: APIGatewayProxyEventV2) {
  const auth = await requireAuth(event);
  const factionId = event.pathParameters?.factionId;
  if (!factionId) throw new HttpError(400, "Missing factionId");
  if (!(await userFactions.isMember(auth.userId, factionId))) {
    throw new HttpError(403, "You don't have this faction registered");
  }
  const rows = await forum.listThreads(factionId);
  return json(200, rows);
}

interface CreateThreadBody {
  title: string;
}

export async function createThread(event: APIGatewayProxyEventV2) {
  const auth = await requireAuth(event);
  const factionId = event.pathParameters?.factionId;
  if (!factionId) throw new HttpError(400, "Missing factionId");
  if (!(await userFactions.isMember(auth.userId, factionId))) {
    throw new HttpError(403, "You don't have this faction registered");
  }
  const body = parseBody<CreateThreadBody>(event);
  if (!body.title) throw new HttpError(400, "title is required");
  const thread = await forum.createThread(factionId, auth.userId, body.title);
  return json(201, thread);
}

export async function listPosts(event: APIGatewayProxyEventV2) {
  const auth = await requireAuth(event);
  const threadId = event.pathParameters?.threadId;
  if (!threadId) throw new HttpError(400, "Missing threadId");
  const thread = await forum.getThread(threadId);
  if (!(await userFactions.isMember(auth.userId, thread.faction_id))) {
    throw new HttpError(403, "You don't have this faction registered");
  }
  const rows = await forum.listPosts(threadId);
  return json(200, rows);
}

interface CreatePostBody {
  text: string;
}

export async function createPost(event: APIGatewayProxyEventV2) {
  const auth = await requireAuth(event);
  const threadId = event.pathParameters?.threadId;
  if (!threadId) throw new HttpError(400, "Missing threadId");
  const thread = await forum.getThread(threadId);
  if (!(await userFactions.isMember(auth.userId, thread.faction_id))) {
    throw new HttpError(403, "You don't have this faction registered");
  }
  const body = parseBody<CreatePostBody>(event);
  if (!body.text) throw new HttpError(400, "text is required");
  const post = await forum.createPost(threadId, thread.faction_id, auth.userId, body.text);
  return json(201, post);
}
