const { Client } = require('pg');
const regions = ['ap-south-1', 'us-east-1', 'us-west-1', 'us-west-2', 'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'sa-east-1', 'ca-central-1', 'af-south-1', 'me-south-1', 'me-central-1'];
const projectRef = 'hfhceubdyuokcvdodbjw';
const password = 'AeanZsrq9W7KeqPO';
const user = `postgres.${projectRef}`;
async function testConnection(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const url = `postgresql://${user}:${password}@${host}:6543/postgres`;
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
  try { 
    await client.connect(); 
    console.log(`SUCCESS: ${url}`); 
    await client.end(); 
    return url; 
  }
  catch (err) { 
    if (!err.message.includes('not found')) { 
      console.log(`Region ${region} failed with auth error: ${err.message}`); 
      return url; 
    } 
    return null; 
  }
}
async function findRegion() {
  console.log('Testing regions...');
  const promises = regions.map(r => testConnection(r));
  const results = await Promise.all(promises);
  const found = results.find(r => r !== null);
  if (found) console.log(`Found candidate URL: ${found}`);
  else console.log('Could not find region.');
}
findRegion();
