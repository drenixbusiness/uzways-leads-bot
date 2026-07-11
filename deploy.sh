#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <user@host> <remote-path> [docker|pm2]"
  echo "Example: $0 ubuntu@1.2.3.4 /home/ubuntu/leads-daily-bot docker"
  exit 1
fi

REMOTE="$1"
REMOTE_PATH="$2"
METHOD="${3:-docker}"
DEPLOY_NAME="leads-daily-bot"
TIMESTAMP="$(date +%Y%m%d%H%M%S)"
LOCAL_TAR="$(mktemp -u "/tmp/${DEPLOY_NAME}-deploy-${TIMESTAMP}.tar.gz")"
REMOTE_TAR="/tmp/${DEPLOY_NAME}-deploy-${TIMESTAMP}.tar.gz"

if [ ! -f package.json ]; then
  echo "Error: deploy.sh must be run from the project root."
  exit 1
fi

tar --exclude='node_modules' --exclude='.git' --exclude='.idea' --exclude='npm-debug.log' \
    --exclude='*.log' -czf "$LOCAL_TAR" .

scp "$LOCAL_TAR" "$REMOTE:$REMOTE_TAR"

ssh "$REMOTE" bash -lc "'
  set -euo pipefail
  mkdir -p \"$REMOTE_PATH\"
  rm -rf \"$REMOTE_PATH/.deploy_tmp\"
  mkdir -p \"$REMOTE_PATH/.deploy_tmp\"
  tar -xzf \"$REMOTE_TAR\" -C \"$REMOTE_PATH/.deploy_tmp\"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete \"$REMOTE_PATH/.deploy_tmp/\" \"$REMOTE_PATH/\"
    rm -rf \"$REMOTE_PATH/.deploy_tmp\"
  else
    echo 'Warning: rsync not installed on remote host; extracting directly.'
    rm -rf "$REMOTE_PATH"/*
    tar -xzf \"$REMOTE_TAR\" -C \"$REMOTE_PATH\"
  fi
  rm -f \"$REMOTE_TAR\"
  cd \"$REMOTE_PATH\"
  if [ "$METHOD" = "docker" ]; then
    if ! command -v docker >/dev/null 2>&1; then
      echo 'Error: docker is not installed on remote host.'
      exit 1
    fi
    docker build -t "$DEPLOY_NAME" .
    docker stop "$DEPLOY_NAME" 2>/dev/null || true
    docker rm "$DEPLOY_NAME" 2>/dev/null || true
    if [ ! -f .env ]; then
      echo 'Error: .env file not found in project root on remote host.'
      exit 1
    fi
    docker run -d --name "$DEPLOY_NAME" --restart unless-stopped --env-file .env "$DEPLOY_NAME"
  else
    if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
      echo 'Error: node/npm are not installed on remote host.'
      exit 1
    fi
    npm install
    npm install -g pm2
    npx pm2 reloadOrStart ecosystem.config.cjs --env production
    npx pm2 save
  fi
'"

rm -f "$LOCAL_TAR"
echo "Remote deploy complete: $REMOTE -> $REMOTE_PATH ($METHOD)"
