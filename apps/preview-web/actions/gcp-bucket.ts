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

let storageSingleton: ReturnType<Storage["bucket"]> | null = null;

function getBucket() {
  if (!BUCKET_NAME) {
    throw new Error("GCP_BUCKET_NAME is not set");
  }
  if (!storageSingleton) {
    const storage = new Storage({
      apiEndpoint: isEmulator ? GCS_MOCK_API_ENDPOINT : undefined,
    });
    storageSingleton = storage.bucket(BUCKET_NAME);
  }
  return storageSingleton;
}

export async function listFiles(): Promise<BucketFile[]> {
  await requireSession();

  const bucket = getBucket();
  const [files] = await bucket.getFiles({ autoPaginate: true });
  return files.map((file) => ({
    Key: file.name,
    Size: String(file.metadata.size ?? ""),
    LastModified: file.metadata.updated ? new Date(file.metadata.updated) : undefined,
  }));
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
