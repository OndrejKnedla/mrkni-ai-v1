# Database Migrations

This folder contains SQL migrations for the database.

## How to Run Migrations

### Option 1: Using the Supabase Dashboard (Recommended)

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the contents of the migration file (e.g., `create_subscription_tables.sql`)
5. Run the query

### Option 2: Using the Migration Script

1. Make sure you have Node.js installed
2. Install dependencies: `npm install @supabase/supabase-js dotenv`
3. Set up your environment variables in a `.env` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
4. Run the script: `node scripts/run-migrations.js`

## Migration Files

- `create_subscription_tables.sql`: Creates the subscription and credits tables with proper indexes and RLS policies
- `update_model_column.sql`: Updates the model column in the image_generations table to use human-readable model names
