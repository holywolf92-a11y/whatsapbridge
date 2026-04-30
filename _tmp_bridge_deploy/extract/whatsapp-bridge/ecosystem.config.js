module.exports = {
  apps: [
    {
      name: 'falisha-whatsapp-bridge',
      script: 'dist/index.js',
      cwd: '.',
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};