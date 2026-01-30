#!/bin/bash
# Daily Data Cleanup Script
# Run this script daily (recommended: 2 AM) to clean up old data based on retention policies

# Database configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="smart_dry_monitor"
DB_USER="postgres"
DB_PASSWORD="Zawadi"

# Log file
LOG_FILE="/var/log/iteda/daily-cleanup.log"
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log_message "Starting daily data cleanup..."

# Run cleanup function
RESULT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT * FROM public.cleanup_old_data();")

if [ $? -eq 0 ]; then
    log_message "Cleanup completed: $RESULT"
    
    # Parse results
    DELETED_READINGS=$(echo "$RESULT" | awk '{print $1}')
    DELETED_EVENTS=$(echo "$RESULT" | awk '{print $2}')
    
    log_message "Deleted sensor readings: $DELETED_READINGS"
    log_message "Deleted operational events: $DELETED_EVENTS"
else
    log_message "ERROR: Daily cleanup failed"
    exit 1
fi

log_message "Daily cleanup finished"
