// Run Stripe migration
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' }); // Use .env.local file

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

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add_stripe_columns.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing SQL statement: ${statement.substring(0, 50)}...`);

      // Execute the SQL statement
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement
      });

      if (error) {
        // If the error is because the exec_sql function doesn't exist, create it
        if (error.message.includes('function "exec_sql" does not exist')) {
          console.log('Creating exec_sql function...');

          // Create the exec_sql function
          const { error: createFunctionError } = await supabase.rpc('exec_sql', {
            sql: `
              CREATE OR REPLACE FUNCTION exec_sql(sql text)
              RETURNS void AS $$
              BEGIN
                EXECUTE sql;
              END;
              $$ LANGUAGE plpgsql;
            `
          });

          if (createFunctionError) {
            console.error('Error creating exec_sql function:', createFunctionError);

            // Try direct SQL execution as a fallback
            const { error: directError } = await supabase.from('_sql').select('*').eq('query', statement);

            if (directError) {
              console.error('Error executing SQL directly:', directError);
              throw new Error(`Failed to execute SQL: ${directError.message}`);
            }
          } else {
            // Try executing the original statement again
            const { error: retryError } = await supabase.rpc('exec_sql', {
              sql: statement
            });

            if (retryError) {
              console.error('Error executing SQL after creating function:', retryError);
              throw new Error(`Failed to execute SQL: ${retryError.message}`);
            }
          }
        } else {
          console.error('Error executing SQL:', error);
          throw new Error(`Failed to execute SQL: ${error.message}`);
        }
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
