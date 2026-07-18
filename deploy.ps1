param(
  [Parameter(Mandatory=$true)][string]$Remote,
  [Parameter(Mandatory=$true)][string]$RemotePath,
  [string]$Method = 'docker'
)

if (-not (Test-Path './package.json')) {
  Write-Error 'deploy.ps1 must be run from the project root.'
  exit 1
}

$DeployName = 'leads-daily-bot'
$Timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$LocalZip = Join-Path $env:TEMP "$DeployName-deploy-$Timestamp.tar.gz"
$RemoteZip = "/tmp/$DeployName-deploy-$Timestamp.tar.gz"

Write-Host "Creating archive $LocalZip..."
tar.exe --exclude='node_modules' --exclude='.git' --exclude='.idea' --exclude='npm-debug.log' --exclude='*.log' -czf "$LocalZip" .

Write-Host "Uploading archive to $Remote..."
scp $LocalZip "${Remote}:$RemoteZip"

$remoteCommand = @"
set -euo pipefail
mkdir -p '$RemotePath'
rm -rf '$RemotePath/.deploy_tmp'
mkdir -p '$RemotePath/.deploy_tmp'
tar -xzf '$RemoteZip' -C '$RemotePath/.deploy_tmp'
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete '$RemotePath/.deploy_tmp/' '$RemotePath/'
  rm -rf '$RemotePath/.deploy_tmp'
else
  echo 'Warning: rsync not installed on remote host; extracting directly.'
  rm -rf '$RemotePath/*'
  tar -xzf '$RemoteZip' -C '$RemotePath'
fi
rm -f '$RemoteZip'
cd '$RemotePath'
if [ '$Method' = 'docker' ]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo 'Error: docker is not installed on remote host.'
    exit 1
  fi
  docker build -t '$DeployName' .
  docker stop '$DeployName' 2>/dev/null || true
  docker rm '$DeployName' 2>/dev/null || true
  if [ ! -f .env ]; then
    echo 'Error: .env file not found in project root on remote host.'
    exit 1
  fi
  docker run -d --name '$DeployName' --restart unless-stopped --env-file .env '$DeployName'
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
"@

Write-Host "Running remote deploy commands on $Remote..."
ssh $Remote $remoteCommand

Remove-Item $LocalZip -Force
Write-Host "Remote deploy complete: $Remote -> $RemotePath ($Method)"