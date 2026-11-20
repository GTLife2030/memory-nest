import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations, hasSupabase, setElderMode } from "./helpers";

// The clickable mock-up. With a database configured it sits behind sign-in, so these journeys
// run in demo mode only; the gate itself is checked at the bottom.
test.describe("mock-up journeys", () => {
  test.skip(hasSupabase, "the mock-up is behind sign-in when a database is configured");

  const heading = (page: Page) => page.getByRole("heading", { level: 1 });
  const next = (page: Page) => page.getByRole("button", { name: "Verder", exact: true }).click();

  test("the map lists every flow and marks itself as an example", async ({ page }) => {
    await page.goto("/voorbeeld");
    await expect(page.getByRole("complementary", { name: "Voorbeeld" })).toContainText(
      "Niets wordt bewaard",
    );
    for (const flow of [
      "Een nest beginnen",
      "Een cadeau ontvangen",
      "De vraag van deze week",
      "Vertel eens over deze foto",
      "Van opname naar hoofdstuk",
      "Rondkijken in het nest",
    ]) {
      await expect(page.getByRole("link", { name: flow })).toBeVisible();
    }
    await expect(page.getByText("Volgt in een latere levering").first()).toBeVisible();
    expect((await page.goto("/voorbeeld"))?.headers()["x-robots-tag"] ?? "").not.toContain(
      "index,",
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("Marieke sets up a nest for her mother, start to finish", async ({ page }) => {
    await page.goto("/voorbeeld/onboarding");
    await expect(heading(page)).toHaveText("Voor wie is dit nest?");
    await page.getByRole("radio", { name: /Voor mijn eigen levensverhaal/ }).check();
    await next(page);
    await expect(heading(page)).toBeFocused();
    await page.getByLabel("Naam van de verteller").fill("Opa Wim");
    await page.getByLabel("Wie is dat voor de kinderen?").fill("opa");
    await next(page);
    await page.getByRole("checkbox", { name: "Muziek" }).check();
    await page.getByRole("checkbox", { name: "Familie" }).uncheck();
    await next(page);
    await page.getByRole("radio", { name: /Eén keer per maand/ }).check();
    await next(page);
    await page.getByRole("radio", { name: /Via WhatsApp/ }).check();
    await next(page);
    await page.getByRole("radio", { name: /Zand/ }).check();
    await next(page);

    await expect(heading(page)).toHaveText("Je nest staat klaar");
    const summary = page.getByRole("definition");
    await expect(summary.filter({ hasText: "Opa Wim (opa)" })).toBeVisible();
    await expect(summary.filter({ hasText: "Jeugd, Muziek" })).toBeVisible();
    await expect(summary.filter({ hasText: "Eén keer per maand" })).toBeVisible();
    await expect(summary.filter({ hasText: "Via WhatsApp" })).toBeVisible();

    await page.getByRole("button", { name: "Vorige" }).click();
    await expect(heading(page)).toHaveText("Kies hoe je nest eruitziet");
    await expect(page.getByRole("radio", { name: /Zand/ })).toBeChecked();
    await next(page);
    await page.getByRole("link", { name: "Naar de eerste vraag" }).click();
    await expect(page).toHaveURL(/\/voorbeeld\/vraag$/);
  });

  test("oma Truus opens her gift in elder mode and reaches the recorder", async ({
    page,
    context,
    baseURL,
  }) => {
    await setElderMode(context, baseURL!, true);
    await page.goto("/voorbeeld/cadeau");
    await expect(heading(page)).toHaveText("Je hebt een cadeau gekregen van Lotte");
    await expect(page.getByLabel("Je cadeaucode")).toHaveValue("NEST-TRUUS-2026");
    await page.getByRole("button", { name: "Maak mijn cadeau open" }).click();
    await expect(page.getByText("Wie ze scant, hoort jouw stem.")).toBeVisible();
    await page.getByRole("button", { name: "Hoe werkt het vertellen?" }).click();
    await expect(page.getByText("Gevraagd door Lotte")).toBeVisible();
    await page.getByRole("link", { name: "Vertel het" }).click();
    await expect(heading(page)).toHaveText("Vertel maar");
    await expect(page.getByRole("button", { name: "Tik om te vertellen" })).toBeVisible();
  });

  test("answering the weekly question by voice: skip, record, pause, listen back, save", async ({
    page,
  }) => {
    await page.goto("/voorbeeld/vraag");
    const first = await page.getByRole("heading", { level: 2 }).textContent();
    await page.getByRole("button", { name: "Andere vraag" }).click();
    await expect(page.getByRole("status")).toHaveText("Geen probleem. Hier is een andere vraag.");
    await expect(page.getByRole("heading", { level: 2 })).not.toHaveText(first ?? "");
    await page.getByRole("button", { name: "Vertel het" }).click();

    // Finishing before recording explains what to do instead of failing silently.
    await page.getByRole("button", { name: "Ik ben klaar" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Tik eerst op de ronde knop" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Tik om te vertellen" }).click();
    await expect(page.getByRole("timer")).toHaveText(/0:0[1-9]/, { timeout: 5000 });
    await page.getByRole("button", { name: /Ik luister/ }).click();
    const paused = await page.getByRole("timer").textContent();
    await page.waitForTimeout(1500);
    await expect(page.getByRole("timer"), "the clock stands still while paused").toHaveText(
      paused ?? "",
    );
    await expect(page.getByText(/resterend|nog \d+ (seconden|minuten)|maximaal/i)).toHaveCount(0);

    await page.getByRole("button", { name: "Ik ben klaar" }).click();
    await expect(heading(page)).toHaveText("Luister het terug");
    await page.getByRole("button", { name: "Afspelen" }).click();
    await expect(page.getByRole("button", { name: "Pauzeren" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByRole("button", { name: "Bewaar deze opname" }).click();
    await expect(heading(page)).toHaveText("Je verhaal is bewaard");
    await page.getByRole("link", { name: "Bekijk hoe het een hoofdstuk wordt" }).click();
    await expect(page).toHaveURL(/\/voorbeeld\/verhaal$/);
  });

  test("answering by typing instead skips the recording screens", async ({ page }) => {
    await page.goto("/voorbeeld/vraag");
    await page.getByRole("button", { name: "Liever typen" }).click();
    await page.getByLabel("Jouw antwoord").fill("Naar koffie en naar boenwas.");
    await page.getByRole("button", { name: "Bewaar", exact: true }).click();
    await expect(heading(page)).toHaveText("Je verhaal is bewaard");
    await expect(page.getByText("Je kunt het altijd nog aanvullen of aanpassen.")).toBeVisible();
  });

  test("a photo becomes the start of a story, with the AI guess clearly labelled", async ({
    page,
  }) => {
    await page.goto("/voorbeeld/foto");
    await page
      .getByRole("radio", { name: /Twee jonge mensen op een kermis/ })
      .check({ force: true });
    await next(page);
    await expect(page.getByText("Voorstel, door AI gemaakt")).toBeVisible();
    await expect(page.getByText("vermoedelijk jaren zestig")).toBeVisible();
    await expect(page.getByText("We herkennen nooit wie er op een foto staat.")).toBeVisible();
    await page.getByRole("button", { name: "Vertel erover" }).click();
    await expect(page.getByText("Vertel eens over die beer.")).toBeVisible();
    await page.getByRole("button", { name: "Tik om te vertellen" }).click();
    await page.getByRole("link", { name: "Ik ben klaar" }).click({ timeout: 5000 });
    await expect(heading(page)).toHaveText("Je verhaal is bewaard");
  });

  test("from recording to approved chapter: source audio per paragraph, edit, approve", async ({
    page,
  }) => {
    await page.goto("/voorbeeld/verhaal");
    const read = page.getByRole("button", { name: "Lees het verhaal" });
    await expect(read).toBeDisabled();
    await expect(read).toBeEnabled({ timeout: 8000 });
    await read.click();

    await expect(page.getByText("bewerkt met AI", { exact: true })).toBeVisible();
    const paragraph = page.getByRole("button", { name: /Mijn vader had een bakkerij/ });
    await expect(paragraph).toHaveAttribute("aria-expanded", "false");
    await paragraph.click();
    await expect(paragraph).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("Fragment van 0:04 tot 0:23")).toBeVisible();
    await expect(page.getByText(/Ja, mijn vader hè, die had dus een bakkerij/)).toBeVisible();
    await expect(page.getByText(/Je noemt mevrouw Smulders bij naam/)).toBeVisible();

    await page.getByRole("button", { name: "Iets aanpassen" }).click();
    const text = page.getByLabel("Tekst van je verhaal");
    await expect(text).toHaveValue(/krentenbollen/);
    await text.fill("Mijn vader was bakker.");
    await page.getByRole("button", { name: "Bewaar wijzigingen" }).click();
    await page.getByRole("button", { name: "Het klopt zo" }).click();

    await expect(heading(page)).toHaveText("Wie mag dit lezen?");
    await page.getByRole("radio", { name: /Alleen ik/ }).check();
    await expect(page.getByText(/Wordt nooit door AI bewerkt/)).toBeVisible();
    await page.getByRole("button", { name: "Keur het verhaal goed" }).click();
    await expect(heading(page)).toHaveText("Je hoofdstuk staat in het nest");
    await expect(page.getByText("Hoe rook het 's ochtends vroeg in de bakkerij?")).toBeVisible();
    await page.getByRole("link", { name: "Bekijk het in het nest" }).click();
    await expect(page).toHaveURL(/\/voorbeeld\/nest\/verhalen\/bakkerij$/);
    await expect(heading(page)).toHaveText("De bakkerij van mijn vader");
  });

  test("looking around the nest: stories, timeline zoom, people, chapter order, search", async ({
    page,
  }) => {
    await page.goto("/voorbeeld/nest");
    await expect(page.getByText("Dag Marieke")).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Onderdelen van het nest" });
    await expect(nav.getByRole("link", { name: "Deze week" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await nav.getByRole("link", { name: "Verhalen" }).click();
    await expect(page.getByText("11 verhalen")).toBeVisible();
    await page.getByRole("link", { name: "Van Joris" }).click();
    await expect(page.getByText("1 verhaal", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Omgerold" })).toBeVisible();

    await nav.getByRole("link", { name: "Tijdlijn" }).click();
    await expect(page.getByRole("heading", { name: "Jaren vijftig" })).toBeVisible();
    await page.getByRole("link", { name: "Per maand" }).click();
    await expect(page.getByRole("heading", { name: "Februari 1953" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Jaren vijftig" })).toHaveCount(0);

    await nav.getByRole("link", { name: "Personen" }).click();
    const henk = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { name: "Henk" }) });
    await expect(henk.getByText("Genoemd in 3 verhalen")).toBeVisible();

    await nav.getByRole("link", { name: "Hoofdstukken" }).click();
    const titles = () => page.locator("ol > li h2").allTextContents();
    await expect(page.locator("ol > li h2").first()).toHaveText("Jeugd in Tilburg");
    await expect(page.getByRole("button", { name: "Jeugd in Tilburg omhoog" })).toBeDisabled();
    await page.getByRole("button", { name: "Henk omhoog" }).click();
    expect((await titles()).slice(0, 2)).toEqual(["Henk", "Jeugd in Tilburg"]);
    await expect(page.getByRole("status")).toHaveText("Henk staat nu op plaats 1.");

    await nav.getByRole("link", { name: "Zoeken" }).click();
    await page.getByLabel("Waar zoek je naar?").fill("nootmuskaat");
    await page.getByRole("button", { name: "Zoek", exact: true }).click();
    await expect(page.getByRole("heading", { name: "2 passages gevonden" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Uit Brabantse worstenbroodjes/ })).toBeVisible();
    await page.getByLabel("Waar zoek je naar?").fill("raketwetenschap");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Niets gevonden" })).toBeVisible();
  });

  test("switching persona changes whose nest view you see", async ({ page }) => {
    await page.goto("/voorbeeld/nest");
    await page.getByLabel("Bekijk als").selectOption("truus");
    await page.getByRole("button", { name: "Wissel" }).click();
    await expect(page.getByText("Dag Oma Truus")).toBeVisible();
    await expect(page.getByText("Je kijkt nu mee als Oma Truus.")).toBeVisible();
  });

  test("an open source panel stays accessible, and an unknown story is a 404", async ({ page }) => {
    await page.goto("/voorbeeld/nest/verhalen/kermis");
    await page.getByRole("button", { name: /Hij stond bij de schiettent/ }).click();
    await expectNoA11yViolations(page);
    expect((await page.goto("/voorbeeld/nest/verhalen/bestaat-niet"))?.status()).toBe(404);
  });
});

test("with a database, the mock-up is closed to visitors who are not signed in", async ({
  page,
}) => {
  test.skip(!hasSupabase, "needs Supabase");
  await page.goto("/voorbeeld/onboarding");
  await expect(page).toHaveURL(/\/inloggen\?next=/);
});
