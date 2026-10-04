import { createServer } from "../../apps/server/src/server.js";

// Keep browser runs isolated from both a developer's saved rooms and a database.
delete process.env.DATABASE_URL;
process.env.PUBLIC_ORIGIN = "http://127.0.0.1:3191";
const service = await createServer({ logger: false, storageFile: false });
const port = Number(process.env.PORT ?? 3191);
await service.app.listen({ host: "127.0.0.1", port });

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void service.close();
  });
}
