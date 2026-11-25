import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { catalogPath, verifyCatalogTransition } from './catalog-update';

const base = execFileSync('/usr/bin/git', ['rev-parse', 'HEAD^'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const previous = execFileSync('/usr/bin/git', ['show', base + ':' + catalogPath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
verifyCatalogTransition(base, JSON.parse(previous), JSON.parse(readFileSync(catalogPath, 'utf8')));
console.log('Verified the exact catalog additions and corrections against the parent revision.');
