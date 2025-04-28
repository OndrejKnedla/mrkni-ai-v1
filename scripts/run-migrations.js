// Run database migrations
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

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

async function runMigration() {
  try {
    console.log('Running database migrations...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'create_subscription_tables.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSql });
    
    if (error) {
      // If exec_sql function doesn't exist, create it first
      if (error.message.includes('function exec_sql') && error.message.includes('does not exist')) {
        console.log('Creating exec_sql function...');
        
        const createFunctionSql = `
          CREATE OR REPLACE FUNCTION exec_sql(sql text)
          RETURNS JSONB
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            result JSONB;
          BEGIN
            EXECUTE sql;
            RETURN '{}'::JSONB;
          EXCEPTION WHEN OTHERS THEN
            RETURN jsonb_build_object('error', SQLERRM);
          END;
          $$;
        `;
        
        // Execute the SQL directly
        const { error: functionError } = await supabase.rpc('exec_sql', { sql: createFunctionSql });
        
        if (functionError) {
          // If we still can't create the function, try direct SQL
          console.log('Trying to create function via direct SQL...');
          
          // Use REST API to execute SQL directly
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              sql: createFunctionSql
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error creating exec_sql function via REST API:', errorData);
            process.exit(1);
          }
          
          console.log('Successfully created exec_sql function');
          
          // Now try to run the migration again
          const { error: retryError } = await supabase.rpc('exec_sql', { sql: migrationSql });
          
          if (retryError) {
            console.error('Error running migration after creating function:', retryError);
            process.exit(1);
          }
        } else {
          // Function created, now run the migration
          const { error: retryError } = await supabase.rpc('exec_sql', { sql: migrationSql });
          
          if (retryError) {
            console.error('Error running migration after creating function:', retryError);
            process.exit(1);
          }
        }
      } else {
        console.error('Error running migration:', error);
        process.exit(1);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Exception running migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
