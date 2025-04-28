# Creating Database Tables for Subscription Management

This directory contains the necessary files to create the database tables required for subscription management.

## Option 1: Using the Admin UI (Recommended)

1. Log in to the application with an admin account
2. Go to the Admin > Subscriptions page
3. Try to add a subscription
4. When you see the message about missing tables, click the "Create Database Tables" button
5. Wait for the tables to be created
6. Try adding a subscription again

## Option 2: Running the SQL Script Manually

If the automatic table creation doesn't work, you can run the SQL script manually:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the contents of the `create-tables.sql` file
5. Run the query

## Tables Created

This will create two tables:

1. `subscriptions` - Stores user subscription information
   - `id` - UUID primary key
   - `user_id` - UUID of the user
   - `tier` - Subscription tier (free, basic, premium)
   - `status` - Subscription status (active, canceled, expired)
   - `current_period_start` - Start date of the current subscription period
   - `current_period_end` - End date of the current subscription period
   - `created_at` - Creation timestamp
   - `updated_at` - Last update timestamp

2. `credits` - Stores user credit information
   - `id` - UUID primary key
   - `user_id` - UUID of the user
   - `image_credits` - Number of image credits
   - `video_credits` - Number of video credits
   - `created_at` - Creation timestamp
   - `updated_at` - Last update timestamp

Both tables have Row Level Security (RLS) policies that allow users to view their own data and allow the service role to manage all data.
