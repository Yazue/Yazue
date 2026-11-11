import assert from "node:assert/strict";
import test from "node:test";
import { fetchCalendar, parseCalendar } from "./calendar.mjs";

function fixture(startDate = "2025-11-09", length = 368, activeIndex = -1) {
  const start = new Date(`${startDate}T00:00:00Z`);
  return Array.from({ length }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    const column = Math.floor((start.getUTCDay() + index) / 7);
    const row = date.getUTCDay();
    const level = index === activeIndex ? 4 : 0;
    return `<td data-level='${level}' class="foo ContributionCalendar-day" data-date="${date.toISOString().slice(0, 10)}" id="contribution-day-component-${row}-${column}"></td>`;
  });
}

test("parses an anonymous calendar even when rows arrive out of date order", () => {
  const html = fixture("2025-11-09", 368, 367).reverse().join("");
  const { columns, days } = parseCalendar(`<table><td class="other">Other</td>${html}</table>`);
  assert.equal(columns, 53);
  assert.equal(days.length, 368);
  assert.deepEqual(days[0], { date: "2025-11-09", column: 0, row: 0, level: 0 });
  assert.deepEqual(days.at(-1), { date: "2026-11-11", column: 52, row: 3, level: 4 });
});

test("accepts an inactive 54-column calendar spanning a leap year", () => {
  const { columns, days } = parseCalendar(fixture("2023-12-30", 366).join(""));
  assert.equal(columns, 54);
  assert.equal(days[0].row, 6);
  assert.ok(days.some(({ date }) => date === "2024-02-29"));
  assert.ok(days.every(({ level }) => level === 0));
});

test("rejects empty, truncated, and non-contiguous calendars", () => {
  assert.throws(() => parseCalendar("<html>Unavailable</html>"), /complete/);
  assert.throws(() => parseCalendar(fixture().slice(0, 300).join("")), /complete/);
  const days = fixture();
  days[10] = days[9];
  assert.throws(() => parseCalendar(days.join("")), /missing, duplicate, or misplaced/);
});

test("rejects calendar cells with unknown levels or invalid weekdays", () => {
  const html = fixture().join("");
  assert.throws(() => parseCalendar(html.replace("data-level='0'", "data-level='7'")), /malformed/);
  assert.throws(() => parseCalendar(html.replace("2025-11-09", "2025-11-10")), /weekday/);
});

test("rejects a username that is not safe to put into a profile URL", async () => {
  await assert.rejects(fetchCalendar("Yazue/../"), /Invalid GitHub username/);
});
