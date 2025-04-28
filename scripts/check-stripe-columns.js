// Check if Stripe columns exist in subscriptions table
require('dotenv').config({ path: '.env.local' });
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

async function checkStripeColumns() {
  try {
    console.log('Checking if Stripe columns exist in subscriptions table...');
    
    // SQL to check if columns exist
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'subscriptions'
        AND column_name IN ('stripe_customer_id', 'stripe_subscription_id');
      `
    });

    if (error) {
      console.error('Error checking columns:', error);
      
      // Try adding the columns
      console.log('Attempting to add Stripe columns...');
      
      const { error: addError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Add Stripe columns to subscriptions table if they don't exist
          ALTER TABLE public.subscriptions 
          ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
          ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

          -- Create indexes for better performance
          CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
          CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
        `
      });
      
      if (addError) {
        console.error('Error adding columns:', addError);
        return;
      }
      
      console.log('✅ Stripe columns added successfully!');
      return;
    }
    
    if (data && data.length === 2) {
      console.log('✅ Both Stripe columns already exist in the subscriptions table.');
    } else if (data && data.length === 1) {
      console.log('⚠️ Only one Stripe column exists. Adding the missing column...');
      
      // Add the missing column
      const missingColumn = data[0].column_name === 'stripe_customer_id' 
        ? 'stripe_subscription_id' 
        : 'stripe_customer_id';
      
      const { error: addError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Add missing Stripe column
          ALTER TABLE public.subscriptions 
          ADD COLUMN IF NOT EXISTS ${missingColumn} TEXT;

          -- Create index for better performance
          CREATE INDEX IF NOT EXISTS idx_subscriptions_${missingColumn} ON public.subscriptions(${missingColumn});
        `
      });
      
      if (addError) {
        console.error(`Error adding ${missingColumn}:`, addError);
        return;
      }
      
      console.log(`✅ Missing column ${missingColumn} added successfully!`);
    } else {
      console.log('⚠️ Stripe columns do not exist. Adding them...');
      
      // Add both columns
      const { error: addError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Add Stripe columns to subscriptions table
          ALTER TABLE public.subscriptions 
          ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
          ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

          -- Create indexes for better performance
          CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
          CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
        `
      });
      
      if (addError) {
        console.error('Error adding columns:', addError);
        return;
      }
      
      console.log('✅ Stripe columns added successfully!');
    }
  } catch (error) {
    console.error('Error checking/adding Stripe columns:', error);
  }
}

checkStripeColumns();
