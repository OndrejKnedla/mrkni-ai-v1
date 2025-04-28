// This script is designed to be run as a scheduled task (e.g., via cron job)
// to automatically add monthly credits to all active users.

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Key environment variables.');
  process.exit(1);
}

async function addMonthlyCredits() {
  console.log('Starting monthly credit addition process...');

  // Create a Supabase client with the service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Call the add_monthly_credits function
    const { data, error } = await supabase.rpc('add_monthly_credits');

    if (error) {
      console.error('Error adding monthly credits:', error);
      process.exit(1);
    }

    // Get the count of users who received credits
    const { count, error: countError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (countError) {
      console.error('Error counting active subscriptions:', countError);
    }

    console.log(`Successfully added monthly credits to ${count || 'all'} active users based on their subscription tier`);

    // Log to credit_logs table
    const { error: logError } = await supabase
      .from('credit_logs')
      .insert({
        operation_type: 'scheduled_monthly_addition',
        credits_added: 0, // The actual amount is calculated in the SQL function
        description: `Scheduled monthly credit addition to ${count || 'all'} active users based on their subscription tier`,
      });

    if (logError) {
      console.error('Error logging credit addition:', logError);
    }

    process.exit(0);
  } catch (error) {
    console.error('Exception adding monthly credits:', error);
    process.exit(1);
  }
}

// Run the function
addMonthlyCredits();
