param(
    [string]$EnvFile = "pantheon-sonarcloud.env"
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot $EnvFile

if (-not (Test-Path $envPath)) {
    Write-Error "Sonar env file not found: $envPath"
    exit 1
}

$vars = @{}
Get-Content $envPath | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) {
        return
    }

    $parts = $line -split '=', 2
    if ($parts.Count -ne 2) {
        return
    }

    $vars[$parts[0].Trim()] = $parts[1].Trim()
}

if (-not $vars.ContainsKey('SONAR_HOST_URL') -or -not $vars.ContainsKey('SONAR_TOKEN')) {
    Write-Error "Env file must include SONAR_HOST_URL and SONAR_TOKEN"
    exit 1
}

$env:SONAR_HOST_URL = $vars['SONAR_HOST_URL']
$env:SONAR_TOKEN = $vars['SONAR_TOKEN']
$projectVersion = node (Join-Path $repoRoot "scripts\foundation-release\resolve-sonar-project-version.mjs")
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

$projectVersion = $projectVersion.Trim()
if (-not $projectVersion) {
    Write-Error "Unable to resolve Sonar project version"
    exit 1
}

Write-Host "Running SonarQube scan against $($env:SONAR_HOST_URL) with project version $projectVersion"
Remove-Item coverage -Force -ErrorAction SilentlyContinue
Remove-Item coverage.out -Force -ErrorAction SilentlyContinue
go test "-coverprofile=coverage.out" ./...
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

if (-not (Get-Command Sonar-Scanner -ErrorAction SilentlyContinue)) {
    Write-Error "sonar-scanner is not installed. Install SonarScanner CLI locally, then rerun this script."
    exit 1
}

Sonar-Scanner `
  "-Dsonar.host.url=$env:SONAR_HOST_URL" `
  "-Dsonar.token=$env:SONAR_TOKEN" `
  "-Dsonar.projectVersion=$projectVersion" `
  "-Dsonar.qualitygate.wait=true"

exit $LASTEXITCODE
