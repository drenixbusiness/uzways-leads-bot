# Leads Daily Bot

This repository contains a Telegram bot that sends a daily leads report from a Google Sheet.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
GOOGLE_SHEET_ID=your_sheet_id_here
TIMEZONE=America/Chicago
REPORT_HOUR=0
REPORT_MINUTE=1
```

## Run locally

```bash
npm start
```

## Send a manual report

```bash
npm run report
```

## Run with PM2 on a remote server

```bash
npm install -g pm2
npm install
npm run pm2:start
npm run pm2:save
```

### Windows startup

On Windows, `pm2 startup` may not work because Windows does not use a Linux init system. Instead, install the PM2 Windows service:

```bash
npm install -g pm2-service-install
npm run pm2:install-service
```

Or use Windows Task Scheduler to start `npm run pm2:start` at boot.

## Remote server deployment

To keep the bot running when your local computer is off, deploy it to a remote Linux server or VPS.

Recommended options:
- DigitalOcean
- AWS EC2
- Google Cloud Compute Engine
- Hetzner
- Vultr

### Deploy helper scripts

From the project root, use one of these helpers:

```bash
bash deploy.sh ubuntu@YOUR_SERVER_IP /home/ubuntu/leads-daily-bot docker
```

```powershell
.\deploy.ps1 -Remote ubuntu@YOUR_SERVER_IP -RemotePath /home/ubuntu/leads-daily-bot -Method docker
```

The remote machine must have SSH access and a valid `.env` file in the project root.

### Manual remote deployment

1. SSH into the server:

```bash
ssh ubuntu@YOUR_SERVER_IP
```

2. Install Node.js and Docker or Node.js and PM2.

3. Copy the project to the server and create `.env`.

4. Start the bot with Docker or PM2.

- Docker option:

```bash
docker build -t leads-daily-bot .
docker run -d --name leads-daily-bot --restart unless-stopped --env-file .env leads-daily-bot
```

- PM2 option:

```bash
npm install
npm install -g pm2
npx pm2 start ecosystem.config.cjs --env production
npx pm2 save
```

## Docker deployment

Build the Docker image:

```bash
docker build -t leads-daily-bot .
```

Run the container:

```bash
docker run -d --name leads-daily-bot \
  -e TELEGRAM_BOT_TOKEN=your_token \
  -e TELEGRAM_CHAT_ID=your_chat_id \
  -e GOOGLE_SHEET_ID=your_sheet_id \
  -e TIMEZONE=America/Chicago \
  -e REPORT_HOUR=0 \
  -e REPORT_MINUTE=1 \
  leads-daily-bot
```

## Deploy notes

- The bot must run on a remote server or cloud VM to stay active when your local computer is off.
- Use PM2 or Docker to keep the bot alive after reboot.
- If the remote server is powered off, the bot will stop until the server is back online.
