import fs from "node:fs";
import path from "node:path";
import { argv } from "node:process";
import { fileURLToPath } from "node:url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the path to the file
const imagePath = path.resolve(__dirname, argv[2]);

const buffer = fs.readFileSync(imagePath);
const base64Image = buffer.toString("base64");
const fullBase64Image = `data:image/png;base64,${base64Image}`;

console.log(fullBase64Image);
