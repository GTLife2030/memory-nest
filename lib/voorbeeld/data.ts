/**
 * Sample content for the clickable mock-up (/voorbeeld): the fictional Familie de Wit.
 * This is demo content, not UI copy, which is why it lives here and not in messages/nl.json.
 * Nothing here is real: no real people, recordings or photos.
 */
export type Precision = "day" | "month" | "year" | "decade";

export type MockParagraph = {
  text: string;
  /** What was literally said, before editing. Shown when a reader taps the paragraph. */
  spoken: string;
  startS: number;
  endS: number;
};

export type MockStory = {
  id: string;
  title: string;
  teller: string;
  date: string;
  precision: Precision;
  chapterId: string;
  theme: string;
  status: "approved" | "needs_review";
  people: string[];
  places: string[];
  paragraphs: MockParagraph[];
};

export const chapters = [
  { id: "jeugd", title: "Jeugd in Tilburg" },
  { id: "liefde", title: "Henk" },
  { id: "werk", title: "Werken en verhuizen" },
  { id: "gezin", title: "Ons gezin" },
  { id: "wijsheid", title: "Wat ik heb geleerd" },
  { id: "saar", title: "Het eerste jaar van Saar" },
];

export const stories: MockStory[] = [
  {
    id: "bakkerij",
    title: "De bakkerij van mijn vader",
    teller: "Oma Truus",
    date: "1955-01-01",
    precision: "decade",
    chapterId: "jeugd",
    theme: "jeugd",
    status: "approved",
    people: ["Vader", "Truus"],
    places: ["Tilburg", "De Heuvel"],
    paragraphs: [
      {
        text: "Mijn vader had een bakkerij aan de Heuvel in Tilburg. Om vier uur 's ochtends stond hij al op, en dan rook het hele huis naar vers brood.",
        spoken:
          "Ja, mijn vader hè, die had dus een bakkerij, aan de Heuvel was dat, in Tilburg. En die stond, nou, om vier uur 's ochtends stond hij al op. En dan rook het hele huis, het hele huis rook dan naar vers brood.",
        startS: 4,
        endS: 23,
      },
      {
        text: "Ik mocht op zaterdag de krentenbollen tellen. Daar was ik heel precies in. Als er één te weinig was, moest de hele plaat opnieuw.",
        spoken:
          "En ik mocht op zaterdag, mocht ik de krentenbollen tellen. Daar was ik heel precies in hoor. Als er eentje te weinig was dan moest de hele plaat opnieuw, ja.",
        startS: 24,
        endS: 41,
      },
      {
        text: "De klanten kwamen achterom. Mevrouw Smulders altijd als eerste, die wilde het brood nog warm.",
        spoken:
          "De klanten die kwamen achterom, hè. Mevrouw Smulders altijd als eerste, die wilde, die wilde het brood nog warm hebben.",
        startS: 42,
        endS: 55,
      },
    ],
  },
  {
    id: "watersnood",
    title: "De nacht van het water",
    teller: "Oma Truus",
    date: "1953-02-01",
    precision: "month",
    chapterId: "jeugd",
    theme: "familie",
    status: "approved",
    people: ["Tante Riet", "Vader"],
    places: ["Zeeland", "Tilburg"],
    paragraphs: [
      {
        text: "Ik was zes en ik heb het zelf niet gezien. Maar tante Riet woonde in Zeeland, en die stond drie dagen later bij ons op de stoep met één koffer.",
        spoken:
          "Ik was zes, dus ik heb het zelf niet gezien, dat moet ik er eerlijk bij zeggen. Maar tante Riet die woonde in Zeeland en die stond drie dagen later bij ons op de stoep. Met één koffer.",
        startS: 3,
        endS: 22,
      },
      {
        text: "Mijn vader heeft die week elke nacht doorgebakken. Het brood ging met de vrachtwagen mee naar het zuiden.",
        spoken:
          "En mijn vader die heeft die week, elke nacht heeft hij doorgebakken. En dat brood dat ging dan met de vrachtwagen mee, naar het zuiden.",
        startS: 23,
        endS: 37,
      },
    ],
  },
  {
    id: "kermis",
    title: "Verkering met Henk op de kermis",
    teller: "Oma Truus",
    date: "1966-07-01",
    precision: "year",
    chapterId: "liefde",
    theme: "liefde",
    status: "needs_review",
    people: ["Henk"],
    places: ["Tilburg"],
    paragraphs: [
      {
        text: "Hij stond bij de schiettent en hij kon er niks van. Drie keer mis.",
        spoken:
          "Hij stond bij de schiettent, Henk, en hij kon er niks van. Echt niks. Drie keer mis.",
        startS: 5,
        endS: 14,
      },
      {
        text: "Toen heb ik het geweer maar overgenomen. Die beer staat nog altijd boven op de kast.",
        spoken:
          "Nou, toen heb ik het geweer maar overgenomen hè. En die beer, die staat nog altijd boven op de kast.",
        startS: 15,
        endS: 26,
      },
    ],
  },
  {
    id: "textiel",
    title: "Mijn eerste baan bij de textielfabriek",
    teller: "Oma Truus",
    date: "1962-01-01",
    precision: "year",
    chapterId: "werk",
    theme: "werk",
    status: "approved",
    people: ["Juffrouw Verbunt"],
    places: ["Tilburg"],
    paragraphs: [
      {
        text: "Ik was zestien en ik verdiende elf gulden in de week. Negen gaf ik thuis af.",
        spoken:
          "Ik was zestien. En ik verdiende elf gulden in de week, en daarvan gaf ik er negen thuis af.",
        startS: 2,
        endS: 12,
      },
      {
        text: "Het lawaai van de weefgetouwen hoor ik nog. Je praatte met je handen.",
        spoken:
          "Dat lawaai van die weefgetouwen, dat hoor ik nog. Je praatte met je handen, anders ging het niet.",
        startS: 13,
        endS: 24,
      },
    ],
  },
  {
    id: "utrecht",
    title: "Verhuizen naar Utrecht",
    teller: "Oma Truus",
    date: "1971-01-01",
    precision: "year",
    chapterId: "werk",
    theme: "werk",
    status: "approved",
    people: ["Henk"],
    places: ["Utrecht", "Tilburg"],
    paragraphs: [
      {
        text: "Henk kreeg werk bij de spoorwegen. Ik heb de hele treinreis gehuild en hij deed alsof hij het niet zag.",
        spoken:
          "Henk kreeg werk bij de spoorwegen, in Utrecht. En ik heb de hele treinreis gehuild. En hij deed alsof hij het niet zag, dat vond ik wel lief.",
        startS: 4,
        endS: 19,
      },
    ],
  },
  {
    id: "marieke",
    title: "De geboorte van Marieke",
    teller: "Oma Truus",
    date: "1978-05-12",
    precision: "day",
    chapterId: "gezin",
    theme: "familie",
    status: "approved",
    people: ["Marieke", "Henk"],
    places: ["Utrecht"],
    paragraphs: [
      {
        text: "Ze kwam drie weken te vroeg, op een vrijdag. Henk stond nog in zijn werkjas naast het bed.",
        spoken:
          "Ze kwam drie weken te vroeg. Op een vrijdag. En Henk stond nog in zijn werkjas naast het bed.",
        startS: 3,
        endS: 14,
      },
    ],
  },
  {
    id: "worstenbroodjes",
    title: "Brabantse worstenbroodjes",
    teller: "Oma Truus",
    date: "1985-12-01",
    precision: "decade",
    chapterId: "gezin",
    theme: "familie",
    status: "approved",
    people: ["Vader"],
    places: ["Tilburg"],
    paragraphs: [
      {
        text: "Het recept is van mijn vader. Het geheim is nootmuskaat, en meer dan je denkt.",
        spoken:
          "Het recept is van mijn vader. En het geheim, dat is nootmuskaat. Meer dan je denkt.",
        startS: 2,
        endS: 11,
      },
      {
        text: "Je rolt het deeg dun uit en je vouwt het dicht als een deken. Nooit prikken.",
        spoken:
          "Je rolt het deeg dun uit, en dan vouw je het dicht als een deken. En nooit prikken, hè.",
        startS: 12,
        endS: 22,
      },
    ],
  },
  {
    id: "wijsheid",
    title: "Maak je niet druk",
    teller: "Oma Truus",
    date: "2024-01-01",
    precision: "year",
    chapterId: "wijsheid",
    theme: "wijsheid",
    status: "approved",
    people: ["Vader"],
    places: [],
    paragraphs: [
      {
        text: "Maak je niet druk om dingen die je morgen vergeten bent. Dat zei mijn vader altijd.",
        spoken:
          "Maak je niet druk om dingen die je morgen vergeten bent. Dat zei mijn vader altijd.",
        startS: 1,
        endS: 9,
      },
      {
        text: "Hij had gelijk, al heeft het me zestig jaar gekost om dat toe te geven.",
        spoken: "En hij had gelijk. Al heeft het me zestig jaar gekost om dat toe te geven.",
        startS: 10,
        endS: 17,
      },
    ],
  },
  {
    id: "eerste-lach",
    title: "Eerste lach",
    teller: "Marieke",
    date: "2026-04-28",
    precision: "day",
    chapterId: "saar",
    theme: "eerste keren",
    status: "approved",
    people: ["Saar", "Joris"],
    places: ["Utrecht"],
    paragraphs: [
      {
        text: "Vanochtend lachte ze voor het eerst echt. Naar de lamp, niet naar ons.",
        spoken:
          "Vanochtend lachte ze voor het eerst echt. Naar de lamp. Niet naar ons, naar de lamp.",
        startS: 1,
        endS: 9,
      },
    ],
  },
  {
    id: "omrollen",
    title: "Omgerold",
    teller: "Joris",
    date: "2026-07-19",
    precision: "day",
    chapterId: "saar",
    theme: "eerste keren",
    status: "approved",
    people: ["Saar"],
    places: ["Utrecht"],
    paragraphs: [
      {
        text: "Vandaag rolde ze voor het eerst om. Ze schrok er zelf het meest van.",
        spoken: "Vandaag rolde ze voor het eerst om. En ze schrok er zelf het meest van.",
        startS: 1,
        endS: 8,
      },
    ],
  },
  {
    id: "eerste-hapje",
    title: "Eerste hapje",
    teller: "Marieke",
    date: "2026-08-30",
    precision: "day",
    chapterId: "saar",
    theme: "eerste keren",
    status: "approved",
    people: ["Saar", "Oma Truus"],
    places: ["Utrecht"],
    paragraphs: [
      {
        text: "Wortel. Het meeste zat in haar haar. Oma Truus vond dat er nootmuskaat bij moest.",
        spoken:
          "Wortel. En het meeste zat in haar haar. En oma Truus vond dat er nootmuskaat bij moest.",
        startS: 1,
        endS: 10,
      },
    ],
  },
];

export const people = [
  { name: "Truus de Wit", relation: "oma, verteller", born: "1946" },
  { name: "Henk", relation: "man van Truus", born: "" },
  { name: "Vader", relation: "vader van Truus, bakker", born: "" },
  { name: "Tante Riet", relation: "zus van vader", born: "" },
  { name: "Marieke de Wit", relation: "dochter van Truus", born: "1978" },
  { name: "Joris", relation: "partner van Marieke", born: "" },
  { name: "Saar", relation: "dochter van Marieke en Joris", born: "2026" },
];

/** Stories that mention a person: matched on first name. */
export const storiesAbout = (name: string) => {
  const first = name.split(" ")[0] ?? name;
  return stories.filter((story) => story.people.some((person) => person.includes(first)));
};

export const themes = [
  "Jeugd",
  "Familie",
  "Werk",
  "Liefde",
  "Wijsheid",
  "Geloof",
  "Vakanties",
  "Eten",
  "Muziek",
  "Het huis",
];

export const questions = [
  "Hoe rook het bij jullie thuis op zondag?",
  "Wat was het eerste dat je van je eigen geld kocht?",
  "Wie heeft jou leren fietsen?",
];

export const photos = [
  {
    id: "winkel",
    caption: "Winkelpand met etalage",
    description:
      "Een zwart-witfoto van een winkelpand met een etalage. Twee mensen staan voor de deur.",
    decade: "vermoedelijk jaren vijftig",
    question: "Vertel eens over de dag dat deze foto is gemaakt.",
  },
  {
    id: "kermis",
    caption: "Twee jonge mensen op een kermis",
    description:
      "Twee jonge mensen voor een kraam met lampjes. Een van hen houdt een grote knuffelbeer vast.",
    decade: "vermoedelijk jaren zestig",
    question: "Vertel eens over die beer.",
  },
  {
    id: "tuin",
    caption: "Baby op een kleed in de tuin",
    description:
      "Een baby ligt op een geruit kleed in het gras. Op de achtergrond hangt was aan de lijn.",
    decade: "vermoedelijk zomer 2026",
    question: "Vertel eens over deze middag.",
  },
] as const;

export const personas = [
  { id: "marieke", name: "Marieke", address: "je" },
  { id: "truus", name: "Oma Truus", address: "u" },
  { id: "joris", name: "Joris", address: "je" },
] as const;
export type PersonaId = (typeof personas)[number]["id"];

export const formatClock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

/** Deterministic waveform so server and client render the same bars. */
export const waveLevels = (seed: number, count = 32) =>
  Array.from(
    { length: count },
    (_, i) => 0.25 + 0.7 * Math.abs(Math.sin((i + 1) * (seed + 1.7)) * Math.cos(i * 0.6)),
  );

/** The question Lotte wrote herself for the gift flow. */
export const giftQuestion = "Hoe was het vroeger bij jullie thuis?";
