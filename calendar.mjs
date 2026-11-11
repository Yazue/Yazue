const DAY_MS = 86_400_000;

function cellAttributes(tag) {
  return Object.fromEntries(
    Array.from(tag.matchAll(/\s+([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g),
      ([, name, doubleQuoted, singleQuoted]) => [name.toLowerCase(), doubleQuoted ?? singleQuoted]),
  );
}

export function parseCalendar(html) {
  const cells = [];
  for (const [tag] of html.matchAll(/<td\b[^>]*>/gi)) {
    const attributes = cellAttributes(tag);
    if (!attributes.class?.split(/\s+/).includes("ContributionCalendar-day")) continue;

    const position = /^contribution-day-component-([0-6])-(\d{1,2})$/.exec(attributes.id);
    const date = attributes["data-date"];
    const level = attributes["data-level"];
    if (!position || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^[0-4]$/.test(level)) {
      throw new Error("GitHub contribution calendar contains a malformed cell");
    }

    const row = Number(position[1]);
    const column = Number(position[2]);
    const day = new Date(`${date}T00:00:00Z`);
    if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== date || day.getUTCDay() !== row) {
      throw new Error("GitHub contribution calendar contains an invalid date or weekday");
    }
    cells.push({ day: { date, column, row, level: Number(level) }, timestamp: day.getTime() });
  }

  cells.sort((a, b) => a.timestamp - b.timestamp);
  const first = cells[0];
  const last = cells.at(-1);
  const columns = last ? last.day.column + 1 : 0;
  if (cells.length < 365 || cells.length > 378 || ![53, 54].includes(columns) || first.day.column !== 0) {
    throw new Error("Expected a complete one-year GitHub contribution calendar");
  }

  for (const [index, { day, timestamp }] of cells.entries()) {
    if (timestamp !== first.timestamp + index * DAY_MS || day.column * 7 + day.row !== first.day.row + index) {
      throw new Error("GitHub contribution calendar contains missing, duplicate, or misplaced days");
    }
  }

  return { columns, days: cells.map(({ day }) => day) };
}

export async function fetchCalendar(username = "Yazue") {
  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username)) {
    throw new Error("Invalid GitHub username for contribution calendar");
  }

  const url = `https://github.com/users/${username}/contributions`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    redirect: "error",
    credentials: "omit",
    headers: { Accept: "text/html" },
  });
  if (!response.ok) throw new Error(`GitHub contribution calendar returned HTTP ${response.status}`);

  const calendar = parseCalendar(await response.text());
  const latest = Date.parse(`${calendar.days.at(-1).date}T00:00:00Z`);
  const today = Math.floor(Date.now() / DAY_MS) * DAY_MS;
  if (latest < today - 2 * DAY_MS || latest > today + DAY_MS) {
    throw new Error("GitHub contribution calendar does not end near today's date");
  }
  return calendar;
}
