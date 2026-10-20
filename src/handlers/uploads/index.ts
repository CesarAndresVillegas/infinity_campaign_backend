import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { json, parseBody } from "../../lib/http.js";
import { requireAuth } from "../../lib/auth.js";
import { HttpError } from "../../lib/errors.js";

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

let s3Client: S3Client | undefined;

function getClient() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

interface PresignUploadBody {
  contentType: string;
}

export async function presignUpload(event: APIGatewayProxyEventV2) {
  await requireAuth(event);
  const body = parseBody<PresignUploadBody>(event);
  const extension = ALLOWED_CONTENT_TYPES[body.contentType];
  if (!extension) {
    throw new HttpError(400, "Unsupported content type");
  }

  const bucket = process.env.R2_BUCKET_NAME!;
  const key = `matches/${randomUUID()}.${extension}`;

  const uploadUrl = await getSignedUrl(
    getClient(),
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: body.contentType }),
    { expiresIn: 300 }
  );

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return json(200, { uploadUrl, publicUrl });
}
