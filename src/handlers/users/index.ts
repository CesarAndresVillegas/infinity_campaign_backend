import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { json } from "../../lib/http.js";
import { requireAuth } from "../../lib/auth.js";
import { HttpError } from "../../lib/errors.js";
import * as users from "../../models/users.js";

export async function getUser(event: APIGatewayProxyEventV2) {
  await requireAuth(event);
  const userId = event.pathParameters?.userId;
  if (!userId) throw new HttpError(400, "Missing userId");
  const user = await users.getUserById(userId);
  if (!user) throw new HttpError(404, "User not found");
  return json(200, user);
}
