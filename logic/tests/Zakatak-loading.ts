import fs from 'fs';
import path from 'path';

import { parse } from "csv-parse";
import { finished } from 'stream/promises';
import ExcelJS from 'exceljs';
import { Coordinates } from "../src";

export type ZakatakActionName = "move" | "fight" | "interact" | "speak";

export interface ZakatakRow {
  index: number;

  startCoords: Coordinates;
  endCoords: Coordinates;
  movement: Coordinates;

  actionType: ZakatakActionName;


  repetitions: number;
  // cost: number;
  finalMana: number;
  finalMaxMana: number;
  finalHealth: number;

  familiarityLevel: number;
  damage: number;
  xp: number;
}

export async function loadCsvZakatak(name: string) {
  const contents: ZakatakRow[] = [];
  const file = path.join(__dirname, "./", name);
  // Read the file, 

  const parser = fs
    .createReadStream(file)
    .pipe(parse({
      delimiter: '\t',
      from_line: 3,
    }));

  parser.on('readable', function(){
    let record: string[]; 
    while ((record = parser.read()) !== null) {
      // Work with each record
      contents.push({
        index: parseInt(record[0]),

        startCoords: {
          i: 0,
          j: 0,
          x: parseInt(record[11]) + 61,
          y: -parseInt(record[12]) + 51,
        },
        endCoords: {
          i: 0,
          j: 0,
          x: parseInt(record[17]) + 61,
          y: -parseInt(record[18]) + 51,
        },
        movement: {
          i: 0,
          j: 0,
          x: parseInt(record[15]),
          y: -parseInt(record[16]),
        },
        actionType: record[20].toLowerCase() as ZakatakActionName,
        repetitions: parseInt(record[6]),

        // cost: parseInt(record[9].replace(/,/, '')) * parseInt(record[30].replace(/%/g, '')) / 100, //TODO check this
        finalMana: parseInt(record[37].replace(/,/g, '')),
        finalMaxMana: parseInt(record[42].replace(/,/g, '')),
        finalHealth: parseFloat(record[43].replace(/,/g, '')),

        familiarityLevel: parseInt(record[10]),
        damage: parseFloat(record[77].replace(/,/g, '')),
        xp: parseInt(record[116].replace(/-/g, '0')),
      });
    }
  });
  await finished(parser);
  return contents;
}

export function processWorkSheet(worksheet: ExcelJS.Worksheet): ZakatakRow[] {
  const rows: ZakatakRow[] = [];
  // Find the headers row
  // It is the first one where the first cell is "Index"
  let headersRow = 0;
  worksheet.eachRow((row, rowNumber) => {
    if (row.getCell(1).value === 'Index') {
      headersRow = rowNumber;
    }
  })
  if (headersRow === 0 || worksheet.name.toLowerCase().startsWith('misc')) {
    return rows;
  }
  console.log(worksheet.name);
  // Now we have the headers row, get columns from the names
  const headersRowCells = worksheet.getRow(headersRow).values as ExcelJS.CellValue[];
  const startCoordsCol = headersRowCells.findIndex(cell => cell === 'prev X');
  const endCoordsCol = headersRowCells.findIndex(cell => cell === 'x');
  const movementCol = headersRowCells.findIndex(cell => cell === 'x+');
  const actionTypeCol = headersRowCells.findIndex(cell => cell === 'move type');
  const repetitionsCol = headersRowCells.findIndex(cell => cell === '#');
  // const costCol = headersRowCells.findIndex(cell => cell === 'Next');
  const finalManaCol = headersRowCells.findIndex(cell => cell === 'mana');
  const finalMaxManaCol = headersRowCells.findIndex(cell => cell?.toString().toLowerCase() === 'max');
  const finalHealthCol = headersRowCells.findIndex(cell => cell === 'hp');
  const familiarityLevelCol = headersRowCells.findIndex(cell => cell === 'fam.');
  const damageCol = headersRowCells.findIndex(cell => cell === 'dmg');
  const xpCol = headersRowCells.findIndex(cell => cell === 'xp');





  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < headersRow + 1) {
      return;
    }
    // const values = row.values;
    // console.log(row.getCell(1).value);
    rows.push({
      index: row.getCell(1).value as number,

      startCoords: {
        i: 0,
        j: 0,
        x: row.getCell(startCoordsCol).value as number + 61,
        y: -(row.getCell(startCoordsCol + 1).value as number)  + 51,
      },
      endCoords: {
        i: 0,
        j: 0,
        x: row.getCell(endCoordsCol).value as number + 61,
        y: -(row.getCell(endCoordsCol + 1).value as number) + 51,
      },
      movement: {
        i: 0,
        j: 0,
        x: row.getCell(movementCol).value as number,
        y: -(row.getCell(movementCol + 1).value as number),
      },
      actionType: row.getCell(actionTypeCol).value?.toString().toLowerCase() as ZakatakActionName,
      repetitions: row.getCell(repetitionsCol).value as number,

      // cost: parseInt(record[9].replace(/,/, '')) * parseInt(record[30].replace(/%/g, '')) / 100, //TODO check this
      finalMana: row.getCell(finalManaCol).value as number,
      finalMaxMana: row.getCell(finalMaxManaCol).value as number,
      finalHealth: row.getCell(finalHealthCol).value as number,

      familiarityLevel: row.getCell(familiarityLevelCol).value as number,
      damage: row.getCell(damageCol).value as number,
      xp: row.getCell(xpCol).value as number,
    });
  });
  return rows;
}


export async function convertXlsxZakatak(name: string) {
  const filePath = path.join(__dirname, "./", name);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  console.log(workbook.worksheets.length);
  // const mappedSheets = workbook.worksheets
  //   .map(processWorkSheet)
  //   .filter(([name, rows]) => rows.length > 0)
  //   .reduce((acc, [name, sheet]) => {
  //     acc[name] = sheet;
  //     return acc;
  // }, {} as {[key: string]: ZakatakRow[]});
  workbook.eachSheet((worksheet, sheetId) => {
    const rows = processWorkSheet(worksheet);
    if (rows.length === 0) {
      return;
    }
    console.log(sheetId, worksheet.name, rows.length);
    const outputPath = path.join(__dirname, "./loops-test-data/", `Zakatak.${worksheet.name}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2));
  });
}

export async function loadJsonZakatak(name: string) {
  const file = path.join(__dirname, "./", name);
  const contents = fs.readFileSync(file, 'utf-8');
  return JSON.parse(contents) as ZakatakRow[];
}