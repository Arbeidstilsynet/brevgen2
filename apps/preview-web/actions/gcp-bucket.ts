"use server";

import { requireSession } from "@/auth";
import { Storage } from "@google-cloud/storage";

export interface BucketFile {
  Key: string;
  Size?: string;
  LastModified?: Date;
}

const BUCKET_NAME = process.env.GCP_BUCKET_NAME!;
const GCS_MOCK_API_ENDPOINT = process.env.GCS_MOCK_API_ENDPOINT;
const isEmulator = Boolean(GCS_MOCK_API_ENDPOINT);

let bucket: ReturnType<Storage["bucket"]> | null = null;

function getBucket() {
  if (!BUCKET_NAME) {
    throw new Error("GCP_BUCKET_NAME is not set");
  }
  if (!bucket) {
    const storage = new Storage({
      apiEndpoint: isEmulator ? GCS_MOCK_API_ENDPOINT : undefined,
    });
    bucket = storage.bucket(BUCKET_NAME);
  }
  return bucket;
}

export async function listFiles() {
  await requireSession();

  const bucket = getBucket();
  const files: BucketFile[] = [];

  let pageToken: string | undefined = undefined;
  do {
    const [pageFiles, , response] = await bucket.getFiles({ pageToken });

    files.push(
      ...pageFiles.map((f) => ({
        Key: f.name,
        Size: String(f.metadata.size ?? ""),
        LastModified: f.metadata.updated ? new Date(f.metadata.updated) : undefined,
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
    resumable: isEmulator ? false : undefined,
  });
}

export async function deleteFile(key: string) {
  await requireSession();

  const bucket = getBucket();
  const file = bucket.file(key);
  await file.delete({ ignoreNotFound: true });
}
