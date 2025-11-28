"use server";

import { requireSession } from "@/auth";
import { Storage } from "@google-cloud/storage";

const BUCKET_NAME = process.env.GCP_BUCKET_NAME!;

let bucket: ReturnType<Storage["bucket"]> | null = null;

function getBucket() {
  if (!BUCKET_NAME) {
    throw new Error("GCP_BUCKET_NAME is not set");
  }
  if (!bucket) {
    // Uses Application Default Credentials (ADC)
    const storage = new Storage();
    bucket = storage.bucket(BUCKET_NAME);
  }
  return bucket;
}

export async function listFiles() {
  await requireSession();

  const files: { Key: string; Size?: string; Updated?: string }[] = [];
  let pageToken: string | undefined = undefined;
  const bucket = getBucket();

  do {
    const [pageFiles, , response] = await bucket.getFiles({ pageToken });

    files.push(
      ...pageFiles.map((f) => ({
        Key: f.name,
        Size: String(f.metadata.size ?? ""),
        Updated: f.metadata.updated,
      })),
    );

    const typedResponse = response as { nextPageToken?: string } | undefined;
    pageToken = typedResponse?.nextPageToken;
  } while (pageToken);

  return files;
}

export async function getFile(key: string) {
  await requireSession();

  const bucket = getBucket();
  const file = bucket.file(key);
  const [contents] = await file.download();
  return contents.toString("utf8");
}

export async function uploadFile(key: string, body: string) {
  await requireSession();

  const bucket = getBucket();
  const file = bucket.file(key);
  await file.save(body, {
    contentType: "text/plain; charset=utf-8",
  });
}

export async function deleteFile(key: string) {
  await requireSession();

  const bucket = getBucket();
  const file = bucket.file(key);
  await file.delete({ ignoreNotFound: true });
}
