import { neighborhoods } from "@/lib/territorios/demo-data";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function editDistance(left: string, right: string) {
  const previous = Array.from(
    { length: right.length + 1 },
    (_, index) => index,
  );
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[right.length];
}

export function resolveNeighborhood(input: string) {
  const normalizedInput = normalize(input);
  const exact = neighborhoods.find(
    (neighborhood) => normalize(neighborhood.name) === normalizedInput,
  );
  if (exact) return exact.name;

  const closest = neighborhoods
    .map((neighborhood) => ({
      neighborhood,
      distance: editDistance(normalizedInput, normalize(neighborhood.name)),
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  if (
    !closest ||
    closest.distance > Math.max(1, Math.floor(normalizedInput.length * 0.2))
  )
    return input;
  return closest.neighborhood.name;
}

export function parseCsv(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const text = content.replace(/^\uFEFF/, "");
  const firstBreak = text.search(/[\r\n]/);
  const firstRecord = firstBreak < 0 ? text : text.slice(0, firstBreak);
  const delimiters = [",", ";", "\t"];
  const delimiterCounts = delimiters.map((delimiter) => {
    let count = 0;
    let insideQuotes = false;
    for (let index = 0; index < firstRecord.length; index += 1) {
      if (firstRecord[index] === '"' && firstRecord[index + 1] === '"')
        index += 1;
      else if (firstRecord[index] === '"') insideQuotes = !insideQuotes;
      else if (!insideQuotes && firstRecord[index] === delimiter) count += 1;
    }
    return count;
  });
  const delimiter =
    delimiters[delimiterCounts.indexOf(Math.max(...delimiterCounts))];

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === delimiter) {
      row.push(cell);
      cell = "";
    } else if (character === "\n" || character === "\r") {
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
      if (character === "\r" && text[index + 1] === "\n") index += 1;
    } else {
      cell += character;
    }
  }

  if (quoted)
    throw new Error("O CSV contém um campo entre aspas que não foi fechado.");
  if (cell || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
  }
  return rows;
}
