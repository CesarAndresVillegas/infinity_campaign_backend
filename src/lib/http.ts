import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { HttpError } from "./errors.js";

export function json(statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function noContent(): APIGatewayProxyStructuredResultV2 {
  return { statusCode: 204 };
}

export function parseBody<T>(event: APIGatewayProxyEventV2): T {
  if (!event.body) throw new HttpError(400, "Request body is required");
  try {
    return JSON.parse(event.body) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}
