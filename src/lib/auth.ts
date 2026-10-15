import { CognitoJwtVerifier } from "aws-jwt-verify";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { HttpError } from "./errors.js";

export interface AuthContext {
  userId: string;
  email: string;
}

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | undefined;

function getVerifier() {
  if (!verifier) {
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_CLIENT_ID;
    if (!userPoolId || !clientId) throw new Error("Cognito env vars are not set");
    verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: "id",
      clientId,
    });
  }
  return verifier;
}

export async function requireAuth(event: APIGatewayProxyEventV2): Promise<AuthContext> {
  const header = event.headers?.authorization ?? event.headers?.Authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing bearer token");
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = await getVerifier().verify(token);
    return { userId: payload.sub, email: String(payload.email) };
  } catch {
    throw new HttpError(401, "Invalid token");
  }
}
