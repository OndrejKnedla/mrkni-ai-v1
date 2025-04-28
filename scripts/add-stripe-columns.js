// Add Stripe columns to subscriptions table
require('dotenv').config({ path: '.env.local' }); // Use .env.local file
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key environment variables.');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addStripeColumns() {
  try {
    console.log('Adding Stripe columns to subscriptions table...');
    
    // SQL to add Stripe columns
    const sql = `
      -- Add Stripe columns to subscriptions table if they don't exist
      ALTER TABLE public.subscriptions 
      ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
      ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
    `;

    // Execute the SQL directly using the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error executing SQL:', errorData);
      throw new Error(`Failed to execute SQL: ${JSON.stringify(errorData)}`);
    }

    console.log('✅ Stripe columns added successfully!');
  } catch (error) {
    console.error('Error adding Stripe columns:', error);
    process.exit(1);
  }
}

addStripeColumns();
