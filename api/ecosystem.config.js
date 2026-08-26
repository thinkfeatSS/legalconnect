const path = require('path');

module.exports = {
  apps: [
    {
      name: 'legalconnect-api',
      script: 'dist/src/main.js',
      // Always start from the directory containing this file so that
      // NestJS ConfigModule finds the .env file next to it.
      cwd: path.resolve(__dirname),

      // Node options — cap RAM for Lightsail $10 (2 GB) plan
      node_args: '--max-old-space-size=1536',

      // Single instance + fork mode: safest for Prisma (no shared connection pool issues)
      instances: 1,
      exec_mode: 'fork',

      // Reliability
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      max_memory_restart: '1400M',

      // Logs (directory created by deploy.sh)
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/pm2-err.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,

      // Production env — override individual keys in .env on the server
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
