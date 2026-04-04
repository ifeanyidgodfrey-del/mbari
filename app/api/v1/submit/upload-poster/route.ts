import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400, headers: CORS });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400, headers: CORS });
  }

  // 5 MB limit
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400, headers: CORS });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
    return NextResponse.json({ error: "Only JPG, PNG, or WebP allowed" }, { status: 400, headers: CORS });
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500, headers: CORS });
  }

  const key = `submissions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });

  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME ?? "mbari-media",
    Key: key,
    Body: buffer,
    ContentType: file.type || "image/jpeg",
    Metadata: { "uploaded-by": "submission-form" },
  }));

  const url = `${process.env.R2_PUBLIC_URL ?? "https://media.mbari.art"}/${key}`;
  return NextResponse.json({ url }, { headers: CORS });
}
