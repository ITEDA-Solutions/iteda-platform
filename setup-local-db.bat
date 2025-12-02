@echo off
echo ========================================
echo Smart Dry Monitor - Local PostgreSQL Setup
echo ========================================
echo.

echo This script will help you set up your local PostgreSQL database.
echo.

echo PREREQUISITES:
echo 1. PostgreSQL must be installed and running
echo 2. You should have a PostgreSQL user with database creation privileges
echo.

echo STEPS TO COMPLETE:
echo.

echo 1. UPDATE YOUR .env FILE:
echo    - Edit the DATABASE_URL with your PostgreSQL credentials
echo    - Example: DATABASE_URL="postgresql://username:password@localhost:5432/smart_dry_monitor"
echo    - Update DB_USER, DB_PASSWORD, etc. as needed
echo.

echo 2. CREATE THE DATABASE:
echo    Connect to PostgreSQL as superuser and run:
echo    CREATE DATABASE smart_dry_monitor;
echo.

echo 3. RUN THE SETUP SCRIPT:
echo    psql -U your_username -d smart_dry_monitor -f scripts/setup-database.sql
echo.

echo 4. GENERATE DRIZZLE MIGRATIONS:
echo    npm run db:generate
echo.

echo 5. PUSH SCHEMA TO DATABASE:
echo    npm run db:push
echo.

echo 6. TEST THE CONNECTION:
echo    npm run db:test
echo.

echo DEFAULT ADMIN CREDENTIALS:
echo Email: admin@smartdryers.com
echo Password: admin123
echo (CHANGE THIS IMMEDIATELY IN PRODUCTION!)
echo.

echo ========================================
echo Next.js Scripts Available:
echo ========================================
echo npm run dev          - Start development server
echo npm run db:generate  - Generate Drizzle migrations
echo npm run db:push      - Push schema to database
echo npm run db:studio    - Open Drizzle Studio
echo npm run db:test      - Test database connection
echo.

pause
