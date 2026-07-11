module.exports = {
  apps: [
    {
      name: 'leads-daily-bot',
      script: 'index.js',
      cwd: __dirname,
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
      },
      watch: false,
      autorestart: true,
      max_restarts: 5,
      restart_delay: 5000,
      cron_restart: '0 0 * * *',
    },
  ],
};
