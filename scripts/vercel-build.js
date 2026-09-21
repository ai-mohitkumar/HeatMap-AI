const fs = require('fs');
const { execSync } = require('child_process');

console.log('[HeatShield AI] Running deployment build script...');
console.log('[HeatShield AI] Current directory:', process.cwd());

if (fs.existsSync('frontend')) {
  console.log('[HeatShield AI] Running in root directory. Building frontend subproject...');
  execSync('npm --prefix frontend install && npm --prefix frontend run build', { stdio: 'inherit' });
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }
  fs.cpSync('frontend/dist', 'dist', { recursive: true, force: true });
  console.log('[HeatShield AI] Synced frontend/dist to root dist directory.');
} else {
  console.log('[HeatShield AI] Running in frontend directory. Executing direct Vite build...');
  execSync('npm run build', { stdio: 'inherit' });
  try {
    if (fs.existsSync('../dist')) {
      fs.cpSync('dist', '../dist', { recursive: true, force: true });
    }
  } catch (e) {
    // Non-fatal if parent directory is restricted
  }
}

console.log('[HeatShield AI] Build completed successfully.');
