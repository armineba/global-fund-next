import { simulateGames } from "@global-fund/game-engine";

const count = Number(process.argv[2] ?? 10);
const started = performance.now();
const summary = simulateGames(count);
console.log(
  JSON.stringify(
    {
      ...summary,
      durationSeconds: Math.round((performance.now() - started) / 10) / 100,
    },
    null,
    2,
  ),
);
