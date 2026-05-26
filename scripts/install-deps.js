const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const DEPS = [
  { name: 'pg', url: 'https://registry.npmjs.org/pg/-/pg-8.11.3.tgz' },
  { name: 'pg-pool', url: 'https://registry.npmjs.org/pg-pool/-/pg-pool-3.6.1.tgz' },
  { name: 'pg-protocol', url: 'https://registry.npmjs.org/pg-protocol/-/pg-protocol-1.6.0.tgz' },
  { name: 'pg-types', url: 'https://registry.npmjs.org/pg-types/-/pg-types-2.2.0.tgz' },
  { name: 'postgres-array', url: 'https://registry.npmjs.org/postgres-array/-/postgres-array-2.0.0.tgz' },
  { name: 'postgres-bytea', url: 'https://registry.npmjs.org/postgres-bytea/-/postgres-bytea-2.0.0.tgz' },
  { name: 'postgres-date', url: 'https://registry.npmjs.org/postgres-date/-/postgres-date-1.0.7.tgz' },
  { name: 'pg-connection-string', url: 'https://registry.npmjs.org/pg-connection-string/-/pg-connection-string-2.6.2.tgz' },
  { name: 'postgres-interval', url: 'https://registry.npmjs.org/postgres-interval/-/postgres-interval-1.2.0.tgz' },
  { name: 'pg-int8', url: 'https://registry.npmjs.org/pg-int8/-/pg-int8-1.0.1.tgz' },
  { name: 'pgpass', url: 'https://registry.npmjs.org/pgpass/-/pgpass-1.0.5.tgz' },
  { name: 'split2', url: 'https://registry.npmjs.org/split2/-/split2-4.2.0.tgz' },
  { name: 'xtend', url: 'https://registry.npmjs.org/xtend/-/xtend-4.0.2.tgz' }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function run() {
  const nodeModules = path.join(__dirname, '..', 'node_modules');
  if (!fs.existsSync(nodeModules)) {
    fs.mkdirSync(nodeModules);
  }

  const tempDir = path.join(__dirname, '..', 'temp_npm');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  console.log('Downloading and installing dependencies...');

  for (const dep of DEPS) {
    const tarPath = path.join(tempDir, `${dep.name}.tgz`);
    const depDir = path.join(nodeModules, dep.name);

    if (fs.existsSync(depDir)) {
      console.log(`- ${dep.name} is already installed.`);
      continue;
    }

    console.log(`- Downloading ${dep.name}...`);
    try {
      await download(dep.url, tarPath);
      
      fs.mkdirSync(depDir, { recursive: true });
      
      // Extract using tar command
      console.log(`  Extracting ${dep.name}...`);
      execSync(`tar -xzf "${tarPath}" -C "${depDir}"`);
      
      // npm tarballs extract into a "package" directory. We need to move its contents up.
      const extractedPackageDir = path.join(depDir, 'package');
      if (fs.existsSync(extractedPackageDir)) {
        const files = fs.readdirSync(extractedPackageDir);
        for (const file of files) {
          const src = path.join(extractedPackageDir, file);
          const dst = path.join(depDir, file);
          fs.renameSync(src, dst);
        }
        fs.rmdirSync(extractedPackageDir);
      }
      
      console.log(`  Successfully installed ${dep.name}!`);
    } catch (err) {
      console.error(`  Failed to install ${dep.name}:`, err.message);
    }
  }

  // Cleanup temp dir
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (_) {}

  console.log('\nAll dependencies installed!');
}

run();
