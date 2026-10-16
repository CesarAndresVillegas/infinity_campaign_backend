import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { HttpError } from "./lib/errors.js";
import { json } from "./lib/http.js";
import * as factionsHandlers from "./handlers/factions/index.js";
import * as matchesHandlers from "./handlers/matches/index.js";
import * as forumHandlers from "./handlers/forum/index.js";
import * as mapHandlers from "./handlers/map/index.js";
import * as usersHandlers from "./handlers/users/index.js";
import { getMe } from "./handlers/auth/me.js";

type RouteHandler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

function route(method: string, path: string, handler: RouteHandler): Route {
  const paramNames: string[] = [];
  const pattern = new RegExp(
    "^" +
      path
        .split("/")
        .map((segment) => {
          if (segment.startsWith(":")) {
            paramNames.push(segment.slice(1));
            return "([^/]+)";
          }
          return segment;
        })
        .join("/") +
      "$"
  );
  return { method, pattern, paramNames, handler };
}

const routes: Route[] = [
  route("GET", "/factions", factionsHandlers.listFactions),
  route("POST", "/me/factions", factionsHandlers.registerFaction),
  route("GET", "/factions/:factionId/leaderboard", factionsHandlers.getLeaderboard),

  route("POST", "/matches", matchesHandlers.createMatch),
  route("GET", "/matches", matchesHandlers.listMatches),
  route("GET", "/matches/:matchId", matchesHandlers.getMatch),
  route("POST", "/matches/:matchId/like", matchesHandlers.likeMatch),
  route("DELETE", "/matches/:matchId/like", matchesHandlers.unlikeMatch),
  route("POST", "/matches/:matchId/views", matchesHandlers.addView),
  route("GET", "/users/:userId/matches", matchesHandlers.listUserMatches),

  route("GET", "/factions/:factionId/threads", forumHandlers.listThreads),
  route("POST", "/factions/:factionId/threads", forumHandlers.createThread),
  route("GET", "/threads/:threadId/posts", forumHandlers.listPosts),
  route("POST", "/threads/:threadId/posts", forumHandlers.createPost),

  route("GET", "/countries", mapHandlers.listCountries),

  route("GET", "/me", getMe),
  route("GET", "/users/:userId", usersHandlers.getUser),
];

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;

  for (const r of routes) {
    if (r.method !== method) continue;
    const match = r.pattern.exec(path);
    if (!match) continue;

    const pathParameters: Record<string, string> = {};
    r.paramNames.forEach((name, i) => {
      pathParameters[name] = match[i + 1];
    });

    try {
      return await r.handler({ ...event, pathParameters });
    } catch (err) {
      if (err instanceof HttpError) {
        return json(err.statusCode, { error: err.message });
      }
      console.error(err);
      return json(500, { error: "Internal server error" });
    }
  }

  return json(404, { error: "Not found" });
}
