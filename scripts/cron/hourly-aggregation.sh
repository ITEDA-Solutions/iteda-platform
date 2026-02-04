#!/bin/bash
# Hourly Data Aggregation Script
# Run this script every hour via cron to aggregate sensor data

# Database configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="smart_dry_monitor"
DB_USER="postgres"
DB_PASSWORD="Zawadi"

# Log file
LOG_FILE="/var/log/iteda/hourly-aggregation.log"
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log_message "Starting hourly data aggregation..."

# Run aggregation for all dryers
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Aggregate data for the previous hour for all dryers
DO \$\$
DECLARE
    dryer_record RECORD;
    target_hour TIMESTAMPTZ;
BEGIN
    target_hour := date_trunc('hour', NOW() - INTERVAL '1 hour');
    
    FOR dryer_record IN SELECT id FROM public.dryers LOOP
        BEGIN
            PERFORM public.aggregate_hourly_data(dryer_record.id, target_hour);
            RAISE NOTICE 'Aggregated data for dryer: %', dryer_record.id;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to aggregate data for dryer %: %', dryer_record.id, SQLERRM;
        END;
    END LOOP;
END \$\$;
EOF

if [ $? -eq 0 ]; then
    log_message "Hourly aggregation completed successfully"
else
    log_message "ERROR: Hourly aggregation failed"
    exit 1
fi

log_message "Hourly aggregation finished"
