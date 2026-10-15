import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { json, parseBody } from "../../lib/http.js";
import { requireAuth } from "../../lib/auth.js";
import { HttpError } from "../../lib/errors.js";
import * as factions from "../../models/factions.js";
import * as userFactions from "../../models/userFactions.js";

export async function listFactions() {
  const rows = await factions.listFactions();
  return json(200, rows);
}

export async function getLeaderboard(event: APIGatewayProxyEventV2) {
  const factionId = event.pathParameters?.factionId;
  if (!factionId) throw new HttpError(400, "Missing factionId");
  const limit = Math.min(Number(event.queryStringParameters?.limit ?? 20), 100);
  const rows = await userFactions.getLeaderboard(factionId, limit);
  return json(200, rows);
}

interface RegisterFactionBody {
  factionId: string;
}

export async function registerFaction(event: APIGatewayProxyEventV2) {
  const auth = await requireAuth(event);
  const body = parseBody<RegisterFactionBody>(event);
  if (!body.factionId) throw new HttpError(400, "factionId is required");
  if (!(await factions.factionExists(body.factionId))) {
    throw new HttpError(404, "Faction not found");
  }
  const row = await userFactions.registerUserFaction(auth.userId, body.factionId);
  return json(201, row);
}
