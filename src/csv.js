export function parseCSV(input) {
  const csv = input.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];
    if (char === '"') {
      if (quoted && next === '"') { field += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field.trim()); field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = []; field = "";
    } else field += char;
  }
  if (field !== "" || row.length > 0) {
    row.push(field.trim());
    if (row.some((value) => value !== "")) rows.push(row);
  }
  return rows;
}

export function parseCoordinates(value) {
  if (!value) return [];
  const cleaned = value.trim().replace(/^[\[(]|[\])]$/g, "").trim();
  const pattern = /(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/g;
  const coordinates = [];
  let match;
  while ((match = pattern.exec(cleaned)) !== null) {
    const lat = Number(match[1]);
    const lon = Number(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      coordinates.push([lat, lon]);
    }
  }
  return coordinates;
}
