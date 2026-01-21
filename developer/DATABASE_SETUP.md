# Smart Dry Monitor - Local PostgreSQL Setup

This guide will help you migrate from Supabase to a local PostgreSQL database.

## Prerequisites

1. **PostgreSQL installed and running**
   - Download from: https://www.postgresql.org/download/
   - Ensure PostgreSQL service is running
   - Note your PostgreSQL username and password

2. **Node.js and npm** (already installed for Next.js)

## Setup Steps

### 1. Configure Environment Variables

Update your `.env` file with your PostgreSQL credentials:

```env
# Local PostgreSQL Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/smart_dry_monitor"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="smart_dry_monitor"
DB_USER="your_username"
DB_PASSWORD="your_password"

# JWT Secret for authentication (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-here"
```

**Important:** Replace `username`, `password`, and `your_username`, `your_password` with your actual PostgreSQL credentials.

### 2. Create the Database

Connect to PostgreSQL as a superuser and create the database:

```sql
CREATE DATABASE smart_dry_monitor;
```

**Using psql command line:**
```bash
psql -U postgres
CREATE DATABASE smart_dry_monitor;
\q
```

### 3. Run the Database Setup Script

Execute the setup script to create all tables, indexes, and initial data:

```bash
psql -U your_username -d smart_dry_monitor -f scripts/setup-database.sql
```

### 4. Install Dependencies

The required packages should already be installed, but if needed:

```bash
npm install pg @types/pg drizzle-orm drizzle-kit bcryptjs jsonwebtoken @types/bcryptjs @types/jsonwebtoken
```

### 5. Generate and Push Schema

Generate Drizzle migrations and push to database:

```bash
npm run db:generate
npm run db:push
```

### 6. Test the Connection

Test your database connection:

```bash
npm run db:test
```

If successful, you should see: `✅ Database connection successful`

### 7. Start the Application

```bash
npm run dev
```

## Default Admin Account

A default admin account is created during setup:

- **Email:** `admin@smartdryers.com`
- **Password:** `admin123`

**⚠️ IMPORTANT:** Change this password immediately in production!

## Available Database Scripts

- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:migrate` - Run migrations
- `npm run db:test` - Test database connection

## Database Schema

The database includes the following main tables:

- **users** - User authentication
- **profiles** - User profile information
- **user_roles** - Role-based access control
- **regions** - Geographic regions
- **dryer_owners** - Dryer owner information
- **dryers** - Dryer device information
- **presets** - Drying presets/configurations
- **sensor_readings** - Time-series sensor data
- **alerts** - System alerts and notifications

## Migration from Supabase

The application has been updated to use a local PostgreSQL database while maintaining API compatibility with the existing Supabase client calls. Key changes:

1. **Authentication:** Custom JWT-based authentication replacing Supabase Auth
2. **Database:** Direct PostgreSQL connection using Drizzle ORM
3. **API Compatibility:** Database client mimics Supabase API structure
4. **Schema:** Complete schema migration with all tables and relationships

## Troubleshooting

### Connection Issues

1. **Check PostgreSQL is running:**
   ```bash
   # Windows
   net start postgresql-x64-14
   
   # Or check services in Task Manager
   ```

2. **Verify credentials in .env file**

3. **Check database exists:**
   ```bash
   psql -U your_username -l
   ```

### Permission Issues

If you get permission errors, ensure your PostgreSQL user has the necessary privileges:

```sql
GRANT ALL PRIVILEGES ON DATABASE smart_dry_monitor TO your_username;
```

### Schema Issues

If tables aren't created properly, you can reset by:

1. Drop and recreate the database
2. Re-run the setup script

## Production Considerations

1. **Change default admin password**
2. **Use environment-specific JWT secrets**
3. **Set up proper database backups**
4. **Configure connection pooling for high traffic**
5. **Set up SSL connections for production**

## Support

If you encounter issues:

1. Check the console for error messages
2. Verify all environment variables are set correctly
3. Ensure PostgreSQL is running and accessible
4. Check database logs for connection issues
