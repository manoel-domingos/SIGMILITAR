async function getAuthSettings() {
  console.log('Fetching public auth configurations from old Supabase Cloud...');
  const oldUrl = 'https://imprdimqcjbndqewioyt.supabase.co/auth/v1/settings';
  // Use old service role key
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcHJkaW1xY2pibmRxZXdpb3l0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMzMDUzNCwiZXhwIjoyMDkyOTA2NTM0fQ.48oc6Zg2qgzlP_8hvuos0ZEDauyy72XLl5TbNnUIEr0';

  try {
    const res = await fetch(oldUrl, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    console.log(`Status: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log('Auth settings returned:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('Error:', await res.text());
    }
  } catch (e) {
    console.error('Fetch failed:', e.message);
  }
}

getAuthSettings();
