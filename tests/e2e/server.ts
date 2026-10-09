import { createServer } from "../../apps/server/src/server.js";
import { installIncomeFixtureRoute } from "../fixtures/install-income-route.js";
import { installSettlementFixtureRoute } from "../fixtures/install-settlement-route.js";
import { installContextFixtureRoute } from "../fixtures/install-context-route.js";

// Keep browser runs isolated from both a developer's saved rooms and a database.
delete process.env.DATABASE_URL;
process.env.PUBLIC_ORIGIN = "http://127.0.0.1:3191";
const service = await createServer({ logger: false, storageFile: false });
installSettlementFixtureRoute(service);
installIncomeFixtureRoute(service);
installContextFixtureRoute(service);

const port = Number(process.env.PORT ?? 3191);
await service.app.listen({ host: "127.0.0.1", port });

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void service.close();
  });
}
