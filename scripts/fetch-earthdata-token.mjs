#!/usr/bin/env node

import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { Buffer } from 'node:buffer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const EARTHDATA_TOKEN_ENDPOINT = 'https://urs.earthdata.nasa.gov/api/users/tokens';

async function promptForMissingCredentials() {
  const rl = createInterface({ input, output });

  try {
    const username =
      process.env.NASA_EARTHDATA_USERNAME?.trim() ||
      (await rl.question('NASA Earthdata username: ')).trim();

    const password =
      process.env.NASA_EARTHDATA_PASSWORD?.trim() ||
      (await rl.question('NASA Earthdata password: ', { hideEchoBack: true })).trim();

    if (!username || !password) {
      throw new Error('NASA Earthdata credentials are required to mint a token.');
    }

    return { username, password };
  } finally {
    rl.close();
  }
}

async function fetchToken(username, password) {
  const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

  const response = await fetch(EARTHDATA_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to mint Earthdata token (${response.status} ${response.statusText}). Response body: ${body}`
    );
  }

  const raw = await response.text();

  try {
    const parsed = JSON.parse(raw);
    const token =
      parsed?.token?.access_token ||
      parsed?.token?.token ||
      parsed?.access_token ||
      parsed?.token ||
      parsed;

    if (typeof token !== 'string') {
      throw new Error('Token response did not include a token string.');
    }

    return token.trim();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return raw.trim();
    }

    throw error;
  }
}

async function saveTokenToEnv(token) {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, '..');
  const envPath = path.join(repoRoot, '.env.local');

  let existing = '';
  try {
    existing = await fs.readFile(envPath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const tokenLine = `VITE_NASA_EARTHDATA_TOKEN=${token}`;

  if (!existing) {
    await fs.writeFile(envPath, `${tokenLine}\n`, { encoding: 'utf8', mode: 0o600 });
    return envPath;
  }

  const lines = existing.split(/\r?\n/);
  let replaced = false;
  const nextLines = lines
    .map((line) => {
      if (line.startsWith('VITE_NASA_EARTHDATA_TOKEN=')) {
        replaced = true;
        return tokenLine;
      }
      return line;
    })
    .filter(Boolean);

  if (!replaced) {
    nextLines.push(tokenLine);
  }

  await fs.writeFile(envPath, `${nextLines.join('\n')}\n`, { encoding: 'utf8', mode: 0o600 });
  return envPath;
}

async function main() {
  const shouldSave = process.argv.includes('--save');
  const { username, password } = await promptForMissingCredentials();
  const token = await fetchToken(username, password);

  console.log('\nNASA Earthdata token minted successfully.');
  console.log('Token:', token);

  if (shouldSave) {
    const envPath = await saveTokenToEnv(token);
    console.log(`Token persisted to ${envPath}.`);
    console.log('The file is gitignored via the existing *.local rule.');
  } else {
    console.log('\nTo use the token, add the following line to your .env.local file (gitignored):');
    console.log(`VITE_NASA_EARTHDATA_TOKEN=${token}`);
    console.log('Alternatively, re-run this command with --save to write it automatically.');
  }

  console.log('\nRemember to treat this token as a secret and rotate it regularly per NASA guidelines.');
}

main().catch((error) => {
  console.error('\nError minting NASA Earthdata token:', error.message);
  process.exitCode = 1;
});

