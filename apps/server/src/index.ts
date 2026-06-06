import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { registerRoutes } from "./routes.js";

const app = Fastify({ logger: { transport: undefined, level: "info" }, bodyLimit: 5 * 1024 * 1024 });

await app.register(cors, {
  // Reflect any origin in dev (the ForgeIt UI + generated preview apps on random ports).
  origin: true,
  credentials: true,
});

await registerRoutes(app);

try {
  await app.listen({ port: env.port, host: "0.0.0.0" });
  app.log.info(`ForgeIt server on http://localhost:${env.port}`);
  app.log.info(
    `services: minimax=${env.minimax.apiKey ? "on" : "off"} insforge=${env.insforge.apiKey ? "on" : "off"} composio=${env.composio.apiKey ? "on" : "off"} railway=${env.railway.token ? "on" : "off"}`,
  );
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
