#!/bin/sh

pm2 stop flq-server

# PM2 Rules:
#    Restart pm2 every 4 hours: --cron-restart="0 */4 * * *"
#    Node Argument Max Old Space Size 1.8Gb: --node-args="--max-old-space-size=1800"
# pm2 start server.js --cron-restart="0 */4 * * *" --node-args="--max-old-space-size=1800" --name flq-server -- flq

# PM2 Rules for Ecosystem:
pm2 start start-flq-server-ecosystem.json --env production
