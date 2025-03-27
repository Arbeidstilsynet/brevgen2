import express, { Express } from "express";
import { handlerGeneratePdf, HandlerGeneratePdfArgs } from "./lib/handler";

const app: Express = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

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

app.use(express.json({ limit: "10mb" }));

app.get("/health", (req, res) => {
  res.status(200).send();
});

app.post("/genererbrev", async (req, res) => {
  try {
    console.info(req.body);
    const result = await handlerGeneratePdf(req.body as HandlerGeneratePdfArgs);
    res.send(result);
  } catch (err) {
    console.error("Error processing request:", err);
    if (err instanceof TypeError) {
      res.status(400).json({
        message: "Invalid input",
        error: err.message,
      });
    } else {
      const error = err instanceof Error ? err.message : String(err);
      res.status(500).json({ message: "Internal error", error });
    }
  }
});

app.listen(port);

export { app };
