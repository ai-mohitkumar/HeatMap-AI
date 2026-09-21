const fs = require('fs');
const { execSync } = require('child_process');

console.log('[HeatShield AI] Running Vercel deployment builder...');
console.log('[HeatShield AI] Current working directory:', process.cwd());

if (fs.existsSync('frontend')) {
  console.log('[HeatShield AI] Detected root context. Building frontend subproject...');
  execSync('npm --prefix frontend install && npm --prefix frontend run build', { stdio: 'inherit' });
  fs.cpSync('frontend/dist', 'dist', { recursive: true, force: true });
} else {
  console.log('[HeatShield AI] Detected frontend context. Running direct build...');
  execSync('npm run build', { stdio: 'inherit' });
}

console.log('[HeatShield AI] Build completed successfully.');
