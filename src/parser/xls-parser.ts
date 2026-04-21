import CFB from "cfb";
import type { ParsedExchange, RawCoin } from "../types/index.js";

interface CellMap {
  [row: number]: { [col: number]: string | number };
}

function parseWorkbookBIFF(buffer: Buffer): CellMap {
  const strings: string[] = [];
  const rows: CellMap = {};
  let pos = 0;

  while (pos < buffer.length - 4) {
    const recType = buffer.readUInt16LE(pos);
    const recLen = buffer.readUInt16LE(pos + 2);
    const recStart = pos + 4;

    if (recStart + recLen > buffer.length) break;

    // SST (Shared String Table)
    if (recType === 0x00fc && recLen > 8) {
      let sstPos = recStart + 8;
      while (sstPos < recStart + recLen - 2) {
        if (sstPos + 3 > buffer.length) break;
        const strLen = buffer.readUInt16LE(sstPos);
        const flags = buffer[sstPos + 2];
        sstPos += 3;

        if (flags & 0x01) {
          const byteCount = strLen * 2;
          if (sstPos + byteCount > recStart + recLen) break;
          strings.push(buffer.subarray(sstPos, sstPos + byteCount).toString("utf16le"));
          sstPos += byteCount;
        } else {
          if (sstPos + strLen > recStart + recLen) break;
          strings.push(buffer.subarray(sstPos, sstPos + strLen).toString("latin1"));
          sstPos += strLen;
        }
      }
    }

    // LABELSST (cell referencing SST)
    if (recType === 0x00fd && recLen >= 10) {
      const row = buffer.readUInt16LE(recStart);
      const col = buffer.readUInt16LE(recStart + 2);
      const sstIdx = buffer.readUInt32LE(recStart + 6);
      if (sstIdx < strings.length) {
        rows[row] ??= {};
        rows[row][col] = strings[sstIdx];
      }
    }

    // NUMBER
    if (recType === 0x0203 && recLen >= 14) {
      const row = buffer.readUInt16LE(recStart);
      const col = buffer.readUInt16LE(recStart + 2);
      const val = buffer.readDoubleLE(recStart + 6);
      rows[row] ??= {};
      rows[row][col] = val;
    }

    pos += 4 + recLen;
  }

  return rows;
}

function extractTypeId(ref: string): number | null {
  const normalized = ref.replace(/\u202f/g, " ");
  const match = normalized.match(/N#\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function isHeaderRow(cell0: string): boolean {
  return /^[ÉEe]metteur$/i.test(cell0) || /change n/i.test(cell0) || /^R[ée]f[ée]rence$/i.test(cell0);
}

export function parseNumistaXls(filePath: string): ParsedExchange {
  const cfb = CFB.read(filePath, { type: "file" });
  const entry = CFB.find(cfb, "Workbook") ?? CFB.find(cfb, "Book");

  if (!entry?.content) {
    throw new Error("Stream 'Workbook' introuvable dans le fichier XLS");
  }

  const rows = parseWorkbookBIFF(Buffer.from(entry.content));
  const sortedKeys = Object.keys(rows).map(Number).sort((a, b) => a - b);

  const title = rows[0]?.[0] != null ? String(rows[0][0]) : "";
  const demanded: RawCoin[] = [];
  const offered: RawCoin[] = [];
  let currentSection: "demand" | "offer" | null = null;

  for (const rowIdx of sortedKeys) {
    const row = rows[rowIdx];
    const cell0 = row[0] != null ? String(row[0]) : "";

    if (/que je demande/i.test(cell0)) {
      currentSection = "demand";
      continue;
    }
    if (/que je donne/i.test(cell0)) {
      currentSection = "offer";
      continue;
    }
    if (cell0 === "TOTAL :" || !cell0.trim() || isHeaderRow(cell0)) {
      continue;
    }
    if (!currentSection) continue;

    const refN = row[2] != null ? String(row[2]) : "";
    const yearRaw = row[4];
    const year = typeof yearRaw === "number" ? Math.floor(yearRaw) : 0;

    const coin: RawCoin = {
      issuer: cell0,
      refKM: row[1] != null ? String(row[1]) : "",
      typeId: extractTypeId(refN),
      title: row[3] != null ? String(row[3]) : "",
      year,
      mintMark: row[5] != null ? String(row[5]) : "",
    };

    if (currentSection === "demand") {
      demanded.push(coin);
    } else {
      offered.push(coin);
    }
  }

  return { title, demanded, offered };
}
