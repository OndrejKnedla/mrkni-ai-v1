# Subscription Management API

This API allows administrators to manage user subscriptions.

## Setup

Before using this API, you need to create the necessary database tables. You can do this in one of two ways:

### Option 1: Run the SQL script in the Supabase Dashboard (Recommended)

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the contents of the `create-tables.sql` file
5. Run the query

### Option 2: Let the API create the tables automatically

The API will attempt to create the tables automatically if they don't exist when you try to add a subscription. However, this method is less reliable and may fail depending on your Supabase configuration.

## API Endpoints

### POST /api/admin/manage-subscription

Manages user subscriptions.

**Request Body:**

```json
{
  "targetUserId": "user-uuid",
  "tier": "premium", // or "basic"
  "action": "add" // or "delete"
}
```

**Response:**

```json
{
  "message": "Subscription added successfully"
}
```

### GET /api/admin/list-users

Lists all users in the system.

**Response:**

```json
{
  "users": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "created_at": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```
