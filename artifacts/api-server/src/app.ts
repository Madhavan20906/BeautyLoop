import express, { type Express } from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve frontend build if present
const possibleStaticDirs = [
  path.resolve(process.cwd(), "../beautyloop/dist/public"),
  path.resolve(process.cwd(), "artifacts/beautyloop/dist/public"),
  path.resolve(__dirname, "../../beautyloop/dist/public"),
];

for (const dir of possibleStaticDirs) {
  if (fs.existsSync(dir)) {
    app.use(express.static(dir));
    app.use((req, res, next) => {
      if (req.method === "GET" && !req.path.startsWith("/api")) {
        res.sendFile(path.join(dir, "index.html"));
        return;
      }
      next();
    });
    break;
  }
}

export default app;
