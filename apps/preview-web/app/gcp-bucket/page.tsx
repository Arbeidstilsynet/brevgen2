import { getFile, listFiles } from "@/actions/gcp-bucket";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

export default async function GcpFilesDebugPage() {
  const session = await getServerSession();
  if (!session) return null;

  const files = await listFiles();
  const example = files.length ? await getFile(files[0].Key) : null;

  return (
    <main style={{ padding: "1rem", fontFamily: "system-ui" }}>
      <h1>GCP Bucket Files</h1>
      <p>Bucket: {process.env.GCP_BUCKET_NAME}</p>
      <br />
      <ul>
        {files.map((f) => (
          <li key={f.Key}>{f.Key}</li>
        ))}
      </ul>
      {example && (
        <>
          <br />
          <h2>
            Example file:({files[0].Key}) date:{files[0].LastModified?.toISOString()}
          </h2>
          <pre>{example}</pre>
        </>
      )}
    </main>
  );
}
