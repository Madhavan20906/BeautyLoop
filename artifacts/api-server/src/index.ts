import path from "node:path";
import fs from "node:fs";

try {
  // Check local .env first, then root workspace .env
  if (fs.existsSync(".env")) {
    process.loadEnvFile(".env");
  } else if (fs.existsSync(path.resolve(process.cwd(), "../../.env"))) {
    process.loadEnvFile(path.resolve(process.cwd(), "../../.env"));
  }
} catch {
  // .env file is optional if env vars are provided directly
}

import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"] || "5000";

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
