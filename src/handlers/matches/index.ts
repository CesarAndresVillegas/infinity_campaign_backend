import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { json, noContent, parseBody } from "../../lib/http.js";
import { requireAuth } from "../../lib/auth.js";
import { HttpError } from "../../lib/errors.js";
import * as matches from "../../models/matches.js";
import type { MatchResult } from "../../models/matches.js";
import * as userFactions from "../../models/userFactions.js";
import * as countries from "../../models/countries.js";
import * as factions from "../../models/factions.js";

const VALID_RESULTS: MatchResult[] = ["win", "draw", "loss"];

interface CreateMatchBody {
  factionId: string;
  countryCode: string;
  opponentUserId?: string;
  opponentFactionId: string;
  result: MatchResult;
  text?: string;
  imageUrls?: string[];
}

export async function createMatch(event: APIGatewayProxyEventV2) {
  const auth = await requireAuth(event);
  const body = parseBody<CreateMatchBody>(event);

  if (!body.factionId || !body.countryCode || !body.opponentFactionId || !body.result) {
    throw new HttpError(400, "Missing required fields");
  }
  if (!VALID_RESULTS.includes(body.result)) {
    throw new HttpError(400, "Invalid result, must be win, draw or loss");
  }
  if (body.opponentUserId === auth.userId) {
    throw new HttpError(400, "You cannot play against yourself");
  }
  if (!(await userFactions.isMember(auth.userId, body.factionId))) {
    throw new HttpError(403, "You don't have this faction registered");
  }
  if (!(await countries.countryExists(body.countryCode))) {
    throw new HttpError(404, "Country not found");
  }
  if (!(await factions.factionExists(body.opponentFactionId))) {
    throw new HttpError(404, "Opponent faction not found");
  }

  const match = await matches.createMatch({
    userId: auth.userId,
    factionId: body.factionId,
    countryCode: body.countryCode,
    opponentUserId: body.opponentUserId ?? null,
    opponentFactionId: body.opponentFactionId,
    result: body.result,
    text: body.text ?? null,
    imageUrls: body.imageUrls,
  });

  return json(201, match);
}

export async function listMatches(event: APIGatewayProxyEventV2) {
  const limit = Math.min(Number(event.queryStringParameters?.limit ?? 20), 100);
  const offset = Number(event.queryStringParameters?.offset ?? 0);
  const rows = await matches.listMatches(limit, offset);
  return json(200, rows);
}

export async function getMatch(event: APIGatewayProxyEventV2) {
  const id = event.pathParameters?.matchId;
  if (!id) throw new HttpError(400, "Missing matchId");
  const match = await matches.getMatchById(id);
  return json(200, match);
}

export async function listUserMatches(event: APIGatewayProxyEventV2) {
  const userId = event.pathParameters?.userId;
  if (!userId) throw new HttpError(400, "Missing userId");
  const limit = Math.min(Number(event.queryStringParameters?.limit ?? 20), 100);
  const offset = Number(event.queryStringParameters?.offset ?? 0);
  const rows = await matches.listUserMatches(userId, limit, offset);
  return json(200, rows);
}

export async function likeMatch(event: APIGatewayProxyEventV2) {
  const auth = await requireAuth(event);
  const id = event.pathParameters?.matchId;
  if (!id) throw new HttpError(400, "Missing matchId");
  await matches.likeMatch(id, auth.userId);
  return noContent();
}

export async function unlikeMatch(event: APIGatewayProxyEventV2) {
  const auth = await requireAuth(event);
  const id = event.pathParameters?.matchId;
  if (!id) throw new HttpError(400, "Missing matchId");
  await matches.unlikeMatch(id, auth.userId);
  return noContent();
}

export async function addView(event: APIGatewayProxyEventV2) {
  const id = event.pathParameters?.matchId;
  if (!id) throw new HttpError(400, "Missing matchId");
  await matches.addView(id);
  return noContent();
}
