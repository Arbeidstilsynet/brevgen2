"use server";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { fromSSO } from "@aws-sdk/credential-providers";

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

const client = new S3Client({
  region: process.env.AWS_REGION ?? "eu-west-1",
  credentials:
    process.env.NODE_ENV === "development"
      ? fromSSO({
          profile: process.env.AWS_PROFILE,
        })
      : undefined,
});

export async function listFiles() {
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
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  const response = await client.send(command);
  return await response.Body?.transformToString();
}

export async function uploadFile(key: string, body: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
  });
  return client.send(command);
}

export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  return client.send(command);
}
