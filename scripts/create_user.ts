import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const args = process.argv.slice(2);
  const email = args[0] || 'admin@paypilot.io';
  const password = args[1] || 'PayPilot2026!';
  const fullName = args[2] || 'Alex Mercer';
  const businessName = args[3] || 'PayPilot Technologies Inc.';

  console.log(`\nCreating pre-confirmed Supabase account:`);
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Name:     ${fullName}`);
  console.log(`Business: ${businessName}\n`);

  // 1. Create confirmed user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      business_name: businessName,
    },
  });

  if (userError) {
    if (userError.message.includes('already registered')) {
      console.log(`User ${email} already exists. Updating password to: ${password}...`);
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (existing) {
        await supabase.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
        });
        console.log(`Password updated successfully!`);
      }
    } else {
      console.error('Failed to create user:', userError.message);
      process.exit(1);
    }
  } else {
    console.log(`User created with ID: ${userData.user.id}`);
  }

  // Get user ID
  const { data: list } = await supabase.auth.admin.listUsers();
  const targetUser = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!targetUser) {
    console.error('Could not locate user.');
    process.exit(1);
  }

  const userId = targetUser.id;

  // 2. Ensure profile exists
  await supabase.from('profiles').upsert({
    id: userId,
    email,
    full_name: fullName,
  });

  // 3. Ensure business exists
  const { data: existingBiz } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle();

  let businessId = existingBiz?.id;

  if (!businessId) {
    const { data: newBiz, error: bizError } = await supabase
      .from('businesses')
      .insert({
        name: businessName,
        owner_id: userId,
        business_email: email,
        currency: 'USD',
        tax_rate: 8.25,
      })
      .select('id')
      .single();

    if (bizError) {
      console.error('Business creation warning:', bizError.message);
    } else {
      businessId = newBiz.id;
    }
  }

  // 4. Ensure business membership exists
  if (businessId) {
    await supabase.from('business_members').upsert(
      {
        business_id: businessId,
        user_id: userId,
        role: 'owner',
      },
      { onConflict: 'business_id,user_id' }
    );
  }

  console.log(`\n======================================================`);
  console.log(`SUCCESS! You can now sign in at http://localhost:3000/login`);
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`======================================================\n`);
}

main().catch(console.error);
