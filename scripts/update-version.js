#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Get the current git commit hash (short version)
const commitHash = execSync('git rev-parse --short HEAD').toString().trim();

// Get version from package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;

// Read the script.js file
const scriptPath = path.join(__dirname, '../src/script.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Update the version info in the script
scriptContent = scriptContent.replace(
    /const version = '[^']*';\s*\n\s*const commit = '[^']*';/,
    `const version = '${version}';\n    const commit = '${commitHash}';`
);

// Write the updated content back
fs.writeFileSync(scriptPath, scriptContent);

console.log(`✅ Updated version to v${version}-${commitHash}`);