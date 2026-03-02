const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const PKG_PATH = path.join(__dirname, '..', 'package.json');

// Read original package.json
const original = fs.readFileSync(PKG_PATH, 'utf8');
const pkg = JSON.parse(original);

// Get git short hash
let gitHash;
try {
	gitHash = cp.execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch (err) {
	console.error('Failed to get git hash:', err.message);
	gitHash = 'unknown';
}

// Inject build info into description
const originalDesc = pkg.description;
pkg.description = originalDesc + ' (build: ' + gitHash + ')';
fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, '\t') + '\n');
console.log('Injected build hash: ' + gitHash);

// Run vsce package
const vsce = cp.spawnSync('npx', ['vsce', 'package'], {
	cwd: path.join(__dirname, '..'),
	stdio: 'inherit',
	shell: true
});

// Restore original package.json
fs.writeFileSync(PKG_PATH, original);
console.log('Restored package.json');

process.exit(vsce.status || 0);
