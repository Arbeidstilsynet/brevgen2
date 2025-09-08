"use server";

import { requireSession } from "@/auth";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

const client = new S3Client({
  forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === "true" ? true : undefined,
});

export async function listFiles() {
  await requireSession();

  const files = [];
  let continuationToken = undefined;

  do {
    const command: ListObjectsV2Command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      ContinuationToken: continuationToken,
    });
    const data = await client.send(command);
    if (data.Contents) {
      files.push(...data.Contents);
    }
    if (data.IsTruncated && data.NextContinuationToken) {
      continuationToken = data.NextContinuationToken;
    }
  } while (continuationToken);

  return files;
}

export async function getFile(key: string) {
  await requireSession();
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  const response = await client.send(command);
  return await response.Body?.transformToString();
}

export async function uploadFile(key: string, body: string) {
  await requireSession();
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
  });
  return client.send(command);
}

export async function deleteFile(key: string) {
  await requireSession();
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  return client.send(command);
}
