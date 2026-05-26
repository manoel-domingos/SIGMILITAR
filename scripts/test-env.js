console.log("Available environment variables:");
for (const key of Object.keys(process.env)) {
  console.log(`- ${key}: ${process.env[key] ? 'DEFINED' : 'UNDEFINED'} (length: ${process.env[key]?.length || 0})`);
}
