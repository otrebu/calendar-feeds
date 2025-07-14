#!/usr/bin/env node
const { execSync } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const path = require('path');

function checkDocker() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function ensureAct() {
  try {
    execSync('act --version', { stdio: 'ignore' });
    return 'act';
  } catch {
    const binDir = path.join(__dirname, '..', '.cache');
    const actPath = path.join(binDir, 'act');
    if (!existsSync(actPath)) {
      console.log('Downloading act...');
      mkdirSync(binDir, { recursive: true });
      const url = 'https://github.com/nektos/act/releases/latest/download/act_Linux_x86_64.tar.gz';
      execSync(`curl -sSL ${url} | tar -xz -C ${binDir}`, { stdio: 'inherit' });
      execSync(`chmod +x ${actPath}`);
    }
    return actPath;
  }
}

const workflow = process.argv[2] || '.github/workflows/test.yml';
const job = process.argv[3] || 'test';

if (!checkDocker()) {
  console.error('Docker is required to run GitHub workflows locally.');
  console.error('Please ensure Docker is installed and running.');
  process.exit(1);
}

const actCmd = ensureAct();

const dockerImage = 'ghcr.io/catthehacker/ubuntu:act-latest';

execSync(`${actCmd} -W ${workflow} -j ${job} -P ubuntu-latest=${dockerImage}`, {
  stdio: 'inherit',
});

