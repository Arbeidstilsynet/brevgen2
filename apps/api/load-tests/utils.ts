import fs from "node:fs";
import path from "node:path";

export function deleteOldPdfs(savePdfsDir: string) {
  console.log(`Cleaning up previous PDFs in ${savePdfsDir}`);
  const files = fs.readdirSync(savePdfsDir);
  let deletedCount = 0;

  for (const file of files) {
    if (file.endsWith(".pdf")) {
      fs.unlinkSync(path.join(savePdfsDir, file));
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    console.log(`Deleted ${deletedCount} existing PDF files`);
  }
}
