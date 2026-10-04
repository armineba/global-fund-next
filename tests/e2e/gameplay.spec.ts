import { expect, test, type Page } from "@playwright/test";

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

async function enterLobby(page: Page, secondSeat: "local" | "remote") {
  await page.goto("/");
  await expect(page.getByText("Serveur connecté")).toBeVisible();
  await page.getByLabel("Type du joueur 2").selectOption(secondSeat);
  await page.getByRole("button", { name: "Créer ma partie" }).click();
  await expect(
    page.getByRole("heading", { name: "Le capital vous attend." }),
  ).toBeVisible();
  await expect(page.getByText("CODE D’INVITATION")).toBeVisible();
}

async function openParquet(page: Page) {
  await page.getByRole("button", { name: "Ouvrir le parquet" }).click();
  await expect(
    page.getByRole("heading", { name: "Le circuit des marchés" }),
  ).toBeVisible();
  await expect(page.getByText("OUVERTURE À C/C")).toBeVisible();
}

async function closeNotices(page: Page) {
  const dialog = page.getByRole("dialog");
  const close = dialog.getByRole("button", { name: "Fermer cette scène" });
  // A landing can produce both a board event and a payment notice.
  for (
    let i = 0;
    i < 4 && (await close.isVisible().catch(() => false));
    i += 1
  ) {
    await close.click();
  }
}

test.describe("Parcours jouables", () => {
  test("deux humains sur le même écran jouent le premier tour et passent la main", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await enterLobby(page, "local");
    await openParquet(page);

    const firstInvestor = await page.locator(".active-fund h2").innerText();
    await page
      .locator(".turn-actions")
      .getByRole("button", { name: "Lancer le dé" })
      .click();

    const notice = page.getByRole("dialog");
    await expect(notice).toBeVisible();
    await expect(
      notice.getByRole("button", { name: "Fermer cette scène" }),
    ).toBeVisible();
    await closeNotices(page);
    await expect(
      page.getByRole("heading", { name: "Composer son portefeuille" }),
    ).toBeVisible();

    const buy = page
      .locator(".td-focus")
      .getByRole("button", { name: /Acheter/ });
    await expect(buy).toBeEnabled();
    await buy.click();
    await expect(page.getByText(/1\/5 détenues/).first()).toBeVisible();

    await page.getByRole("button", { name: "Terminer le marché" }).click();
    await expect(
      page.getByRole("heading", { name: "Passage de relais" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Prochain investisseur" }).click();
    await expect(page.locator(".active-fund h2")).not.toHaveText(firstInvestor);
    expect(errors).toEqual([]);
  });

  test("un salon distant synchronise état prêt, lancement et reconnexion après rechargement", async ({
    browser,
  }) => {
    const hostContext = await browser.newContext({ reducedMotion: "reduce" });
    const remoteContext = await browser.newContext({ reducedMotion: "reduce" });
    const host = await hostContext.newPage();
    const remote = await remoteContext.newPage();
    const hostErrors = watchErrors(host),
      remoteErrors = watchErrors(remote);
    try {
      await enterLobby(host, "remote");
      const code = (await host.locator(".room-code b").innerText()).trim();
      await expect(
        host.getByRole("button", { name: "Ouvrir le parquet" }),
      ).toBeDisabled();

      await remote.goto("/");
      await expect(remote.getByText("Serveur connecté")).toBeVisible();
      await remote.getByLabel("Code du salon").fill(code);
      await remote.getByLabel("Nom pour rejoindre").fill("Meridian invité");
      await remote.getByRole("button", { name: "Rejoindre" }).click();
      await expect(
        remote.getByRole("heading", { name: "Le capital vous attend." }),
      ).toBeVisible();
      await expect(host.getByText("Meridian invité")).toBeVisible();

      await remote.getByRole("button", { name: "Je suis prêt" }).click();
      await expect(
        host
          .locator(".lobby-player")
          .filter({ hasText: "Meridian invité" })
          .getByText("Prêt à investir"),
      ).toBeVisible();
      await expect(
        host.getByRole("button", { name: "Ouvrir le parquet" }),
      ).toBeEnabled();
      await host.getByRole("button", { name: "Ouvrir le parquet" }).click();
      await expect(
        host.getByRole("heading", { name: "Le circuit des marchés" }),
      ).toBeVisible();
      await expect(
        remote.getByRole("heading", { name: "Le circuit des marchés" }),
      ).toBeVisible();

      await remote.reload();
      await expect(remote.getByText("Serveur connecté")).toBeVisible();
      await expect(
        remote.getByRole("heading", { name: "Le circuit des marchés" }),
      ).toBeVisible();
      await expect(
        remote.locator(".investor-card").filter({ hasText: "Meridian invité" }),
      ).toBeVisible();
      await expect(
        host.locator(".investor-card").filter({ hasText: "Meridian invité" }),
      ).toBeVisible();

      const activeName = (
        await host.locator(".active-fund h2").innerText()
      ).trim();
      const actor = activeName === "Apex Capital" ? host : remote;
      await actor
        .locator(".turn-actions")
        .getByRole("button", { name: "Lancer le dé" })
        .click();
      await expect(host.getByRole("dialog")).toBeVisible();
      await expect(remote.getByRole("dialog")).toBeVisible();
      await closeNotices(host);
      await closeNotices(remote);
      await expect(
        host.getByRole("heading", { name: "Composer son portefeuille" }),
      ).toBeVisible();
      await expect(
        remote.getByRole("heading", { name: "Composer son portefeuille" }),
      ).toBeVisible();

      // Chaque écran affiche initialement son propre fonds. Inspecter le même
      // investisseur permet de comparer ses positions sur les deux clients.
      for (const client of [host, remote]) {
        await client
          .locator(".investor-card")
          .filter({ hasText: activeName })
          .click();
      }

      const companyName = (
        await actor.locator(".td-focus h2").innerText()
      ).trim();
      const buy = actor
        .locator(".td-focus")
        .getByRole("button", { name: /Acheter/ });
      await expect(buy).toBeEnabled();
      await buy.click();
      await expect(actor.locator(".td-focus")).toContainText("1 / 5 parts");
      const cashAfterTrade = await actor
        .locator(".td-capital strong")
        .innerText();
      await expect(host.locator(".td-capital strong")).toHaveText(
        cashAfterTrade,
      );
      await expect(remote.locator(".td-capital strong")).toHaveText(
        cashAfterTrade,
      );
      await expect(host.locator(".td-focus h2")).toHaveText(companyName);
      await expect(remote.locator(".td-focus h2")).toHaveText(companyName);
      await expect(host.locator(".td-focus")).toContainText("1 / 5 parts");
      await expect(remote.locator(".td-focus")).toContainText("1 / 5 parts");

      await remote.reload();
      await expect(remote.getByText("Serveur connecté")).toBeVisible();
      await remote
        .locator(".investor-card")
        .filter({ hasText: activeName })
        .click();
      await expect(remote.locator(".td-capital strong")).toHaveText(
        cashAfterTrade,
      );
      await expect(remote.locator(".td-focus")).toContainText("1 / 5 parts");
      expect([...hostErrors, ...remoteErrors]).toEqual([]);
    } finally {
      await remoteContext.close();
      await hostContext.close();
    }
  });

  test("sur tablette, le choix de marché initial reste utilisable sans écran modal bloquant", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = watchErrors(page);
    try {
      await enterLobby(page, "local");
      await openParquet(page);
      await page
        .locator(".turn-actions")
        .getByRole("button", { name: "Lancer le dé" })
        .click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      const closeNotice = dialog.getByRole("button", {
        name: "Fermer cette scène",
      });
      await expect(closeNotice).toBeVisible();
      await expect(closeNotice).toBeInViewport();
      await closeNotices(page);
      await expect(
        page.getByRole("heading", { name: "Composer son portefeuille" }),
      ).toBeVisible();
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
});
