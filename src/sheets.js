import { parseCSV, parseCoordinates } from "./csv.js";

export const DEFAULT_SHEET_ID = "1TsdpNmFmBS-3IdxjCSl3jGksqVFkFGGZvikmgpaoy-Y";
export const DEFAULT_SITE_TITLE = "История восстания декабристов";

export function extractSheetId(value) {
  const input = value.trim();
  if (/^[a-zA-Z0-9_-]{20,}$/.test(input)) return input;
  const match = input.match(/\/spreadsheets\/d\/(?!e\/)([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

export async function fetchSheet(sheetId) {
  if (!sheetId) throw new Error("Не указан ID таблицы");
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google Sheets вернул HTTP ${response.status}`);

  const rows = parseCSV(await response.text());
  if (rows.length < 2) throw new Error("В таблице нет данных");

  const headers = rows[0].map((value) => value.toLocaleLowerCase("ru"));
  let coordColumn = headers.findIndex((value) => value.includes("coord") || value.includes("координат"));
  if (coordColumn === -1) coordColumn = 7;
  const pictureColumn = headers.findIndex((value) =>
    ["picture", "картинка", "изображение"].some((word) => value.includes(word)));

  const locations = [];
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const coordinates = parseCoordinates(row[coordColumn] ?? "");
    if (coordinates.length === 0) continue;
    const title = (row[1] || row[2] || `Локация ${index}`).trim();
    const description = (row[3] || "").trim();
    const place = (row[4] || "").trim();
    const parsedZoom = Number.parseInt(row[5], 10);
    const zoom = Math.min(18, Math.max(5, Number.isFinite(parsedZoom) ? parsedZoom : 16));
    const picture = pictureColumn >= 0 ? (row[pictureColumn] || "").trim() : "";
    locations.push({
      coordinates, zoom, title,
      description: [description, place ? `(${place})` : ""].filter(Boolean).join(" "),
      picture,
    });
  }

  if (locations.length === 0) throw new Error("Не найдено ни одной локации с корректными координатами");
  return {
    locations,
    title: sheetId === DEFAULT_SHEET_ID ? DEFAULT_SITE_TITLE : (locations[0].title || "Своя таблица"),
  };
}
