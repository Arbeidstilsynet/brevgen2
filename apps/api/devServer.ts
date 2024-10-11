import express, { Express } from "express";
import { handlerGeneratePdf, HandlerGeneratePdfArgs } from "./function/handler";

const app: Express = express();
const port = 4000;

// local CORS workaround
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

app.post<HandlerGeneratePdfArgs>("/genererbrev", async (req, res) => {
  try {
    const result = await handlerGeneratePdf(req.body);
    res.json(result);
  } catch (error) {
    console.error("Error processing request:", error);
    const body = error instanceof Error ? error.message : String(error);
    res.status(500).json(body);
  }
});

app.listen(port);

export { app };
