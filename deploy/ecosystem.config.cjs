const path = require('path')

const root = path.join(__dirname, '..')

module.exports = {
  apps: [
    {
      name: 'fabrikaflo-api',
      cwd: path.join(root, 'fabrikaflo_bot'),
      script: 'src/server.ts',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      time: true,
      env: {
        NODE_ENV: 'development',
        LOG_PRETTY: 'true',
      },
      env_production: {
        NODE_ENV: 'production',
        LOG_PRETTY: 'false',
      },
    },
  ],
}
