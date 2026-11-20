/**
 * Read-only demo data for "Familie de Wit", shown when no database is connected. The same family
 * is created in the database by supabase/seed/seed.sql. This is sample content, not UI copy.
 */
export const demoFamily = {
  id: "demo",
  name: "Familie de Wit",
  viewerName: "Marieke",
  question: "Hoe rook het bij jullie thuis op zondag?",
  stories: [
    {
      id: "bakkerij",
      title: "De bakkerij van mijn vader",
      teller: "Oma Truus",
      when: "jaren vijftig",
      excerpt:
        "Mijn vader had een bakkerij aan de Heuvel in Tilburg. Om vier uur 's ochtends stond hij al op, en dan rook het hele huis naar vers brood. Ik mocht op zaterdag de krentenbollen tellen.",
      status: "approved" as const,
    },
    {
      id: "kermis",
      title: "Verkering met Henk op de kermis",
      teller: "Oma Truus",
      when: "1966",
      excerpt:
        "Hij stond bij de schiettent en hij kon er niks van. Drie keer mis. Toen heb ik het geweer maar overgenomen, en die beer staat nog altijd boven op de kast.",
      status: "needs_review" as const,
    },
    {
      id: "wijsheid",
      title: "Maak je niet druk",
      teller: "Oma Truus",
      when: "2024",
      excerpt:
        "Maak je niet druk om dingen die je morgen vergeten bent. Dat zei mijn vader altijd, en hij had gelijk, al heeft het me zestig jaar gekost om dat toe te geven.",
      status: "approved" as const,
    },
  ],
  timeline: [
    { date: "1946", dateTime: "1946", title: "Truus wordt geboren in Tilburg" },
    { date: "1966", dateTime: "1966", title: "Verkering met Henk op de kermis" },
    { date: "1978", dateTime: "1978", title: "Geboorte van Marieke" },
    { date: "14 maart 2026", dateTime: "2026-03-14", title: "Saar wordt geboren" },
  ],
  capsule: { title: "Voor Saar, op haar achttiende", releaseDate: "2044-03-14" },
};
