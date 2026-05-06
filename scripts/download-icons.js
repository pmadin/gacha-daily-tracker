#!/usr/bin/env node
// Downloads game icons from cicerakes/Game-Time-Master (GPL-3.0).
// Icon browse: https://github.com/cicerakes/Game-Time-Master/tree/master/game-icons
// Run from the project root: node scripts/download-icons.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/game-data-backup.json');
const ICONS_DIR = path.join(__dirname, '../frontend/public/icons');
const BASE_URL = 'https://raw.githubusercontent.com/cicerakes/Game-Time-Master/refs/heads/master/game-icons/';
const BATCH = 10;

if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });

const { data: games } = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const iconNames = [...new Set(games.map(g => g.icon).filter(Boolean))];
console.log(`Found ${iconNames.length} unique icons across ${games.length} games.\n`);

let downloaded = 0, skipped = 0;
const failed = [];

function fetchIcon(name) {
  return new Promise((resolve) => {
    const dest = path.join(ICONS_DIR, `${name}.gif`);
    if (fs.existsSync(dest)) { skipped++; return resolve(); }

    const url = BASE_URL + encodeURIComponent(name) + '.gif';
    const file = fs.createWriteStream(dest);

    https.get(url, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => { file.close(); downloaded++; resolve(); });
        file.on('error', () => { fs.unlink(dest, () => {}); failed.push(name); resolve(); });
      } else {
        file.destroy();
        fs.unlink(dest, () => {});
        failed.push(name);
        resolve();
      }
    }).on('error', () => {
      file.destroy();
      fs.unlink(dest, () => {});
      failed.push(name);
      resolve();
    });
  });
}

async function main() {
  for (let i = 0; i < iconNames.length; i += BATCH) {
    await Promise.all(iconNames.slice(i, i + BATCH).map(fetchIcon));
    process.stdout.write(`\r  ${Math.min(i + BATCH, iconNames.length)}/${iconNames.length}`);
  }
  console.log('\n');
  console.log(`Downloaded : ${downloaded}`);
  console.log(`Skipped    : ${skipped} (already existed)`);
  console.log(`Failed     : ${failed.length} (not in source repo)`);
  if (failed.length) console.log('\nMissing icons:\n  ' + failed.join('\n  '));
}

main();
