/**
 * PM2 Ecosystem Configuration
 * Production-ready cluster mode setup for LEI Indias application
 * 
 * Usage:
 *   pm2 start ecosystem.config.js        # Start all apps
 *   pm2 stop ecosystem.config.js         # Stop all apps
 *   pm2 reload ecosystem.config.js       # Zero-downtime reload
 *   pm2 restart ecosystem.config.js      # Restart all apps
 *   pm2 delete ecosystem.config.js       # Delete all apps
 */

module.exports = {
  apps: [
    {
      name: 'leiindias-backend',
      script: './backend/dist/server.js',
      cwd: './backend',
      instances: 'max', // Use all CPU cores minus 1 (PM2 reserves one)
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Auto-restart configuration
      autorestart: true,
      watch: false, // Disable in production
      max_memory_restart: '1G', // Restart if memory exceeds 1GB
      
      // Graceful shutdown
      kill_timeout: 5000, // Wait 5 seconds for graceful shutdown
      wait_ready: true, // Wait for app to signal readiness
      listen_timeout: 10000, // Wait 10 seconds for app to start listening
      
      // Logging
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true, // Prefix logs with timestamp
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true, // Merge logs from all instances
      
      // Log rotation (handled by PM2)
      max_size: '10M',
      retain: 7, // Keep 7 rotated log files
      
      // Advanced options
      min_uptime: '10s', // Minimum uptime before considering app stable
      max_restarts: 10, // Max restarts within 1 minute
      restart_delay: 4000, // Wait 4 seconds before restarting
      
      // Health monitoring
      health_check_grace_period: 3000, // Grace period for health checks
      
      // Environment-specific overrides
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'leiindias-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './frontend',
      instances: 1, // Next.js handles clustering internally, use single instance
      exec_mode: 'fork', // Fork mode (not cluster) for Next.js
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Auto-restart configuration
      autorestart: true,
      watch: false, // Disable in production
      max_memory_restart: '1G', // Restart if memory exceeds 1GB
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Logging
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Log rotation
      max_size: '10M',
      retain: 7,
      
      // Advanced options
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Environment-specific overrides
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
  
  // Deployment configuration (optional, for PM2 deploy)
  deploy: {
    production: {
      user: 'ec2-user', // AWS EC2 default user (adjust for your setup)
      host: ['your-server-ip-or-domain'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/leiindias.git', // Update with your repo
      path: '/var/www/leiindias',
      'post-deploy': 'pnpm install && pnpm build:prod && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get update && apt-get install -y git',
    },
  },
};
