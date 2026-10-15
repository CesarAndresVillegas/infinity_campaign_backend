import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { json } from "../../lib/http.js";
import { requireAuth } from "../../lib/auth.js";
import { HttpError } from "../../lib/errors.js";
import * as users from "../../models/users.js";
import * as userFactions from "../../models/userFactions.js";

export async function getMe(event: APIGatewayProxyEventV2) {
  const auth = await requireAuth(event);
  const user = await users.getUserById(auth.userId);
  if (!user) throw new HttpError(404, "User not found");
  const factions = await userFactions.listUserFactions(auth.userId);
  return json(200, { ...user, factions });
}
