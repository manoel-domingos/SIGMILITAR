const fs = require('fs');
const content = fs.readFileSync('app/[escola]/configuracoes/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('/api/admin') || line.includes('fetch(') || line.includes('delete') || line.includes('update')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
