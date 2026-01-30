#!/bin/bash
# Setup Cron Jobs for Data Collection System
# This script sets up automated tasks for aggregation and cleanup

echo "Setting up cron jobs for ITEDA Platform..."

# Make scripts executable
chmod +x /home/esther-zawadi/Downloads/iteda-platform/scripts/cron/hourly-aggregation.sh
chmod +x /home/esther-zawadi/Downloads/iteda-platform/scripts/cron/daily-cleanup.sh

# Create log directory
sudo mkdir -p /var/log/iteda
sudo chown $USER:$USER /var/log/iteda

# Add cron jobs
(crontab -l 2>/dev/null; echo "# ITEDA Platform - Hourly Data Aggregation") | crontab -
(crontab -l 2>/dev/null; echo "0 * * * * /home/esther-zawadi/Downloads/iteda-platform/scripts/cron/hourly-aggregation.sh") | crontab -

(crontab -l 2>/dev/null; echo "# ITEDA Platform - Daily Data Cleanup") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * * /home/esther-zawadi/Downloads/iteda-platform/scripts/cron/daily-cleanup.sh") | crontab -

echo "Cron jobs installed successfully!"
echo ""
echo "Scheduled tasks:"
echo "  - Hourly aggregation: Every hour at minute 0"
echo "  - Daily cleanup: Every day at 2:00 AM"
echo ""
echo "To view cron jobs: crontab -l"
echo "To edit cron jobs: crontab -e"
echo "To view logs: tail -f /var/log/iteda/*.log"
