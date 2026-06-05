const sourceUrl = "https://www.meinschiff.com/de/trips";

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractVisibleCards(text) {
  const cardPattern =
    /(Mein Schiff (?:\d|Relax|Flow))\s+(\d+ N[aä]chte? - .*?)\s+([A-Za-z].*?)(Mo|Di|Mi|Do|Fr|Sa|So),\s+(\d{2}\.\d{2}\.)\s+(Mo|Di|Mi|Do|Fr|Sa|So),\s+(\d{2}\.\d{2}\.\d{2})/g;
  const cards = [];
  let match;

  while ((match = cardPattern.exec(text)) !== null) {
    cards.push({
      ship: match[1],
      title: match[2].trim(),
      route: match[3].replace(/\s+/g, " ").trim(),
      start: `${match[4]}, ${match[5]}`,
      end: `${match[6]}, ${match[7]}`,
    });
  }

  return cards;
}

const response = await fetch(sourceUrl, {
  headers: {
    "user-agent": "cruise-viewer-prototype/0.1 (+local research)",
  },
});

if (!response.ok) {
  throw new Error(`Could not fetch ${sourceUrl}: ${response.status} ${response.statusText}`);
}

const html = await response.text();
const text = stripTags(html);
const resultCount = text.match(/(\d+) Ergebnisse/)?.[1] ?? "unknown";
const cards = extractVisibleCards(text);

console.log(
  JSON.stringify(
    {
      sourceUrl,
      fetchedAt: new Date().toISOString(),
      resultCount,
      visibleCards: cards,
    },
    null,
    2,
  ),
);
