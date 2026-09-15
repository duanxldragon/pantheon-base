param(
  [string]$BaseUrl = "http://127.0.0.1:8080",
  [string]$OutFile = ""
)

$ErrorActionPreference = "Stop"
$artifactRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($OutFile)) {
  $OutFile = Join-Path $artifactRoot "tenant-runtime-matrix.json"
}
$repoRoot = (Resolve-Path (Join-Path $artifactRoot "..\..\..\..")).Path
$mysql = "D:\MySQL\mysql\bin\mysql.exe"
$tenantMatrix = Join-Path $repoRoot "backend\tenantmatrixdb.exe"
$dbPassword = $env:MYSQL_PWD
if ([string]::IsNullOrWhiteSpace($dbPassword)) {
  # Local-only fallback: reuse the gitignored .env.test credential so the
  # matrix stays runnable on the maintainer workstation without a committed
  # secret. Reads PANTHEON_TEST_DB_PASSWORD (or fails with instructions).
  $envFile = Join-Path $repoRoot ".env.test"
  if (Test-Path $envFile) {
    $line = Select-String -Path $envFile -Pattern 'PANTHEON_DSN="root:([^@]+)@' | Select-Object -First 1
    if ($line) { $dbPassword = $line.Matches[0].Groups[1].Value }
  }
  if ([string]::IsNullOrWhiteSpace($dbPassword)) {
    throw "MySQL password not set: export MYSQL_PWD or provide .env.test PANTHEON_DSN"
  }
}
$dbHost = if ($env:PANTHEON_MATRIX_DB_HOST) { $env:PANTHEON_MATRIX_DB_HOST } else { "127.0.0.1" }
$dbPort = if ($env:PANTHEON_MATRIX_DB_PORT) { $env:PANTHEON_MATRIX_DB_PORT } else { "3306" }
$dbUser = if ($env:PANTHEON_MATRIX_DB_USER) { $env:PANTHEON_MATRIX_DB_USER } else { "root" }
$dbName = if ($env:PANTHEON_MATRIX_DB_NAME) { $env:PANTHEON_MATRIX_DB_NAME } else { "pantheon_base" }
$results = [System.Collections.Generic.List[object]]::new()
$runStarted = (Get-Date).ToUniversalTime().ToString("o")
$suffix = (Get-Date).ToUniversalTime().ToString("yyyyMMddHHmmss")
$dictA = "__matrix_a_$suffix"
$dictB = "__matrix_b_$suffix"
$itemA = "matrix-a-value-$suffix"
$itemB = "matrix-b-value-$suffix"
$compatToken = $null
$tenantAToken = $null
$tenantARefresh = $null
$tenantACsrf = $null
$tenantBToken = $null
$tenantBRefresh = $null
$tenantBCsrf = $null
$tenantASession = $null
$tenantBSession = $null

function Invoke-Sql([string]$query) {
  $env:MYSQL_PWD = $dbPassword
  $output = & $mysql "--host=$dbHost" "--port=$dbPort" "--user=$dbUser" "--database=$dbName" "--batch" "--skip-column-names" "--execute=$query" 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "mysql failed: $($output -join " ")"
  }
  return @($output)
}

function Add-Result([string]$name, [string]$expected, [object]$actual, [bool]$passed, [string]$evidence = "") {
  $results.Add([pscustomobject]@{
    id = $name
    expected = $expected
    actual = $actual
    passed = $passed
    evidence = $evidence
  })
}

function Get-Json([string]$body) {
  try {
    return $body | ConvertFrom-Json
  } catch {
    return $null
  }
}

function Get-StatusCode([object]$response) {
  if ($response -and $response.StatusCode) {
    return [int]$response.StatusCode
  }
  return 0
}

function Invoke-Api {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Path,
    [string]$Token = "",
    [string]$Csrf = "",
    [hashtable]$Data = $null,
    [hashtable]$ExtraHeaders = $null
  )

  $headers = @{}
  $webSession = [Microsoft.PowerShell.Commands.WebRequestSession]::new()
  if (-not [string]::IsNullOrWhiteSpace($Token)) {
    $headers["Authorization"] = "Bearer $Token"
    $webSession.Cookies.Add([System.Net.Cookie]::new("pantheon_access_token", $Token, "/", "127.0.0.1"))
  }
  if (-not [string]::IsNullOrWhiteSpace($Csrf)) {
    $headers["X-CSRF-Token"] = $Csrf
    $webSession.Cookies.Add([System.Net.Cookie]::new("pantheon_csrf_token", $Csrf, "/", "127.0.0.1"))
  }
  if ($ExtraHeaders) {
    foreach ($key in $ExtraHeaders.Keys) {
      $headers[$key] = $ExtraHeaders[$key]
    }
  }

  $body = $null
  if ($Data) {
    $body = $Data | ConvertTo-Json -Compress
  }
  $status = 0
  $content = ""
  $contentType = ""
  $responseHeaders = @{}
  try {
    $response = Invoke-WebRequest `
      -UseBasicParsing `
      -Uri "$BaseUrl$Path" `
      -Method $Method `
      -Headers $headers `
      -WebSession $webSession `
      -ContentType "application/json" `
      -Body $body
    $status = Get-StatusCode $response
    $content = [string]$response.Content
    $contentType = [string]$response.Headers["Content-Type"]
    $responseHeaders["csrf"] = [string]$response.Headers["X-CSRF-Token"]
    $responseHeaders["setCookie"] = @($response.Headers["Set-Cookie"])
  } catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse) {
      $status = [int]$errorResponse.StatusCode
      $contentType = [string]$errorResponse.Headers["Content-Type"]
      $responseHeaders["csrf"] = [string]$errorResponse.Headers["X-CSRF-Token"]
      $responseHeaders["setCookie"] = @($errorResponse.Headers["Set-Cookie"])
      $reader = [System.IO.StreamReader]::new($errorResponse.GetResponseStream())
      try {
        $content = $reader.ReadToEnd()
      } finally {
        $reader.Dispose()
      }
    } else {
      $content = $_.Exception.Message
    }
  }

  $payload = Get-Json $content
  return [pscustomobject]@{
    name = $Name
    method = $Method
    path = $Path
    status = $status
    contentType = $contentType
    headers = $responseHeaders
    body = $content
    payload = $payload
  }
}

function Summarize([object]$response) {
  $payload = $response.payload
  if (-not $payload) {
    $text = [string]$response.body
    return [pscustomobject]@{
      status = $response.status
      contentType = $response.contentType
      text = if ($text.Length -gt 240) { $text.Substring(0, 240) } else { $text }
    }
  }

  $summary = [ordered]@{
    status = $response.status
    code = $payload.code
    message = $payload.message
  }
  $data = $payload.data
  if ($null -eq $data) {
    return [pscustomobject]$summary
  }
  if ($data.tenantSelectionRequired -ne $null) {
    $summary.tenantSelectionRequired = [bool]$data.tenantSelectionRequired
    $summary.candidates = @($data.tenantCandidates | ForEach-Object {
      [pscustomobject]@{ tenantId = [int]$_.tenantId; code = $_.code; name = $_.name; role = $_.role }
    })
  }
  if ($response.headers.setCookie -ne $null) {
    $summary.accessCookiePresent = @($response.headers.setCookie | Where-Object { $_ -match "pantheon_access_token=" }).Count -gt 0
    $summary.refreshCookiePresent = @($response.headers.setCookie | Where-Object { $_ -match "pantheon_refresh_token=" }).Count -gt 0
    $summary.sessionIdSuffix = if ($data.sessionId) { ([string]$data.sessionId).Substring([Math]::Max(0, ([string]$data.sessionId).Length - 8)) } else { "" }
    if ($data.user) {
      $summary.userId = [int]$data.user.id
      $summary.username = [string]$data.user.username
    }
  }
  if ($data.items -ne $null) {
    $items = @($data.items)
    $summary.total = if ($data.total -ne $null) { [int64]$data.total } else { $items.Count }
    $summary.items = @($items | Select-Object -First 20 | ForEach-Object {
      [pscustomobject]@{
        id = if ($_.id -ne $null) { [int64]$_.id } else { $null }
        dictCode = $_.dictCode
        dictName = $_.dictName
        itemValue = $_.itemValue
        tenantId = $_.tenantId
      }
    })
  } elseif ($data -is [array]) {
    $summary.items = @($data | Select-Object -First 20 | ForEach-Object {
      [pscustomobject]@{
        id = if ($_.id -ne $null) { [int64]$_.id } else { $null }
        tenantId = $_.tenantId
        dictCode = $_.dictCode
        dictName = $_.dictName
        itemValue = $_.itemValue
      }
    })
  }
  foreach ($key in @("updatedCount", "deletedCount", "revokedCount", "loggedOut", "touched", "total", "successCount", "failedCount")) {
    if ($data.$key -ne $null) {
      $summary[$key] = $data.$key
    }
  }
  if ($data.user -ne $null -and $summary.userId -eq $null) {
    $summary.userId = [int]$data.user.id
    $summary.username = [string]$data.user.username
  }
  if ($data.settings -ne $null) {
    $summary.settingKeys = @($data.settings.PSObject.Properties.Name)
  }
  return [pscustomobject]$summary
}

function Login([int]$TenantId = 0) {
  $data = @{ username = "admin"; password = "123456" }
  if ($TenantId -gt 0) {
    $data.tenantId = $TenantId
  }
  return Invoke-Api -Name "login-$TenantId" -Method "POST" -Path "/api/v1/auth/login" -Data $data
}

function SessionTenant([string]$sessionId) {
  if ([string]::IsNullOrWhiteSpace($sessionId)) {
    return $null
  }
  $rows = @(Invoke-Sql "SELECT tenant_id,IFNULL(revoked_at,'') FROM system_user_session WHERE session_id='$sessionId'")
  if ($rows.Count -eq 0 -or [string]::IsNullOrWhiteSpace([string]$rows[0])) {
    return $null
  }
  $line = [string]$rows[0]
  $parts = $line.Split("`t")
  return [pscustomobject]@{
    sessionIdSuffix = $sessionId.Substring([Math]::Max(0, $sessionId.Length - 8))
    tenantId = [int64]$parts[0]
    revoked = -not [string]::IsNullOrWhiteSpace($parts[1])
  }
}

function Extract-Login([object]$response) {
  $data = $response.payload.data
  $setCookies = @($response.headers.setCookie)
  $access = ($setCookies | ForEach-Object {
    if ($_ -match "pantheon_access_token=([^;]+)") { $Matches[1] }
  } | Select-Object -First 1)
  $refresh = ($setCookies | ForEach-Object {
    if ($_ -match "pantheon_refresh_token=([^;]+)") { $Matches[1] }
  } | Select-Object -First 1)
  $csrf = ($setCookies | ForEach-Object {
    if ($_ -match "pantheon_csrf_token=([^;]+)") { $Matches[1] }
  } | Select-Object -First 1)
  return [pscustomobject]@{
    access = [string]$access
    refresh = [string]$refresh
    csrf = [string]$csrf
    session = [string]$data.sessionId
  }
}

function Get-Items([object]$response) {
  if (-not $response -or -not $response.payload) {
    return @()
  }
  $data = $response.payload.data
  if ($null -eq $data) {
    return @()
  }
  if ($data.items -ne $null) {
    return @($data.items | Where-Object { $_ -ne $null })
  }
  if ($data -is [array]) {
    return @($data | Where-Object { $_ -ne $null })
  }
  return @()
}

try {
  Invoke-Sql "DELETE FROM system_dict_item WHERE dict_code IN ('$dictA','$dictB'); DELETE FROM system_dict_type WHERE dict_code IN ('$dictA','$dictB'); INSERT INTO system_dict_type (dict_code,dict_name,module,status,remark,created_at,updated_at,tenant_id) VALUES ('$dictA','Matrix Tenant A','system',1,'__matrix__',NOW(3),NOW(3),101),('$dictB','Matrix Tenant B','system',1,'__matrix__',NOW(3),NOW(3),202); INSERT INTO system_dict_item (dict_code,item_label_key,item_value,item_color,sort,status,remark,created_at,updated_at,tenant_id) VALUES ('$dictA','matrix.a','$itemA','blue',1,1,'__matrix__',NOW(3),NOW(3),101),('$dictB','matrix.b','$itemB','green',1,1,'__matrix__',NOW(3),NOW(3),202)"
  Add-Result "fixture-setup" "two tagged dict types and items inserted" ([pscustomobject]@{ dictA = $dictA; dictB = $dictB }) $true "local MySQL only"

  Invoke-Sql "UPDATE system_setting SET setting_value='compat' WHERE setting_key='platform.tenant_mode'"
  Start-Sleep -Seconds 6
  $compat = Login
  $compatInfo = Extract-Login $compat
  $compatToken = $compatInfo.access
  Add-Result "compat-login" "HTTP 200 with access token and no tenant claim" (Summarize $compat) ($compat.status -eq 200 -and $compatInfo.access.Length -gt 0) "compat baseline"
  $compatProbe = Invoke-Api -Name "compat-me" -Method "GET" -Path "/api/v1/auth/me" -Token $compatToken
  Add-Result "compat-me" "HTTP 200" (Summarize $compatProbe) ($compatProbe.status -eq 200) "pre-switch token"

  Invoke-Sql "UPDATE system_setting SET setting_value='multi' WHERE setting_key='platform.tenant_mode'"
  Start-Sleep -Seconds 6

  $selection = Login
  $selectionSummary = Summarize $selection
  $candidateIds = @($selection.payload.data.tenantCandidates | ForEach-Object { [int]$_.tenantId })
  Add-Result "multi-login-picker" "selection required with tenant IDs 101 and 202" $selectionSummary ($selection.status -eq 200 -and [bool]$selection.payload.data.tenantSelectionRequired -and ($candidateIds -join ",") -eq "101,202") "password verified candidate disclosure"

  $tenantA = Login 101
  $aInfo = Extract-Login $tenantA
  $tenantAToken = $aInfo.access
  $tenantARefresh = $aInfo.refresh
  $tenantACsrf = $aInfo.csrf
  $tenantASession = $aInfo.session
  $aSessionRow = SessionTenant $tenantASession
  Add-Result "tenant-a-login" "HTTP 200 session stamped tenant_id=101" ([pscustomobject]@{ response = Summarize $tenantA; session = $aSessionRow }) ($tenantA.status -eq 200 -and $aSessionRow.tenantId -eq 101) "explicit tenant choice"

  $tenantB = Login 202
  $bInfo = Extract-Login $tenantB
  $tenantBToken = $bInfo.access
  $tenantBRefresh = $bInfo.refresh
  $tenantBCsrf = $bInfo.csrf
  $tenantBSession = $bInfo.session
  $bSessionRow = SessionTenant $tenantBSession
  Add-Result "tenant-b-login" "HTTP 200 session stamped tenant_id=202" ([pscustomobject]@{ response = Summarize $tenantB; session = $bSessionRow }) ($tenantB.status -eq 200 -and $bSessionRow.tenantId -eq 202) "explicit tenant choice"

  $stale = Invoke-Api -Name "stale-compat-token-in-multi" -Method "GET" -Path "/api/v1/system/dict/type/list?dictCode=$dictA" -Token $compatToken
  Add-Result "stale-compat-token" "deny missing tenant context" (Summarize $stale) ([int]$stale.payload.code -ge 400 -and [string]$stale.payload.message -match "tenant.context.missing|tenant.forbidden") "flag-on stale session"

  $meA = Invoke-Api -Name "tenant-a-me" -Method "GET" -Path "/api/v1/auth/me" -Token $tenantAToken
  Add-Result "tenant-a-me" "HTTP 200" (Summarize $meA) ($meA.status -eq 200) "subject claim path"
  $meAHeaderForged = Invoke-Api -Name "tenant-a-header-forgery" -Method "GET" -Path "/api/v1/system/dict/type/list?dictCode=$dictA" -Token $tenantAToken -ExtraHeaders @{ "X-Tenant-Id" = "202" }
  Add-Result "header-forgery" "deny platform tenant override for admin role" (Summarize $meAHeaderForged) ([int]$meAHeaderForged.payload.code -ge 400 -and [string]$meAHeaderForged.payload.message -match "tenant.forbidden|tenant.context.missing") "X-Tenant-Id tamper"

  $listA = Invoke-Api -Name "tenant-a-list-own" -Method "GET" -Path "/api/v1/system/dict/type/list?dictCode=$dictA" -Token $tenantAToken
  $listBFromA = Invoke-Api -Name "tenant-a-list-foreign" -Method "GET" -Path "/api/v1/system/dict/type/list?dictCode=$dictB" -Token $tenantAToken
  $listB = Invoke-Api -Name "tenant-b-list-own" -Method "GET" -Path "/api/v1/system/dict/type/list?dictCode=$dictB" -Token $tenantBToken
  $listAFromB = Invoke-Api -Name "tenant-b-list-foreign" -Method "GET" -Path "/api/v1/system/dict/type/list?dictCode=$dictA" -Token $tenantBToken
  $aOwn = Get-Items $listA
  $bOwn = Get-Items $listB
  $aForeign = Get-Items $listBFromA
  $bForeign = Get-Items $listAFromB
  $aOwnMatches = @($aOwn | Where-Object { [string]$_.dictCode -eq $dictA })
  $aForeignMatches = @($aOwn | Where-Object { [string]$_.dictCode -eq $dictB })
  $bOwnMatches = @($bOwn | Where-Object { [string]$_.dictCode -eq $dictB })
  $bForeignMatches = @($bOwn | Where-Object { [string]$_.dictCode -eq $dictA })
  Add-Result "dict-list-tenant-a" "only tenant A row visible" (Summarize $listA) ($listA.status -eq 200 -and $aOwnMatches.Count -eq 1 -and $aForeignMatches.Count -eq 0 -and $aForeign.Count -eq 0) "list scope"
  Add-Result "dict-list-tenant-b" "only tenant B row visible" (Summarize $listB) ($listB.status -eq 200 -and $bOwnMatches.Count -eq 1 -and $bForeignMatches.Count -eq 0 -and $bForeign.Count -eq 0) "list scope"

  $exportA = Invoke-Api -Name "tenant-a-export-own" -Method "POST" -Path "/api/v1/system/dict/type/export" -Token $tenantAToken -Csrf $tenantACsrf -Data @{ dictCode = $dictA }
  $exportAForeign = Invoke-Api -Name "tenant-a-export-foreign" -Method "POST" -Path "/api/v1/system/dict/type/export" -Token $tenantAToken -Csrf $tenantACsrf -Data @{ dictCode = $dictB }
  $exportAHasOwn = [string]$exportA.body -match $dictA
  $exportAHasForeign = [string]$exportA.body -match $dictB
  Add-Result "dict-export-tenant-a" "own CSV contains A and excludes B" ([pscustomobject]@{ own = Summarize $exportA; foreign = Summarize $exportAForeign; ownContainsA = $exportAHasOwn; ownContainsB = $exportAHasForeign }) ($exportA.status -eq 200 -and $exportAHasOwn -and -not $exportAHasForeign) "export scope"

  $aId = [uint64]$aOwn[0].id
  $batchTamper = Invoke-Api -Name "tenant-b-batch-tamper" -Method "POST" -Path "/api/v1/system/dict/type/batch-status" -Token $tenantBToken -Csrf $tenantBCsrf -Data @{ typeIds = @($aId); status = 0 }
  Add-Result "batch-id-tamper" "foreign ID rejected or updates zero rows" (Summarize $batchTamper) ($batchTamper.status -ge 400 -or [int]$batchTamper.payload.data.updatedCount -eq 0) "tenant B attempts A ID"

  $updateTamper = Invoke-Api -Name "tenant-b-update-tamper" -Method "PUT" -Path "/api/v1/system/dict/type/$aId" -Token $tenantBToken -Csrf $tenantBCsrf -Data @{ dictCode = $dictA; dictName = "tampered"; module = "system"; status = 1; remark = "__matrix__" }
  Add-Result "update-id-tamper" "foreign ID rejected" (Summarize $updateTamper) ($updateTamper.status -ge 400 -or [int]$updateTamper.payload.code -ge 400) "tenant B attempts A ID"

  # Login creates two active tenant sessions; refresh the most recently issued
  # B session so max_active_sessions_per_user does not revoke the older A
  # session before this scenario reaches logout and audit checks.
  $refreshB = Invoke-Api -Name "tenant-b-refresh" -Method "POST" -Path "/api/v1/auth/refresh" -Data @{ refreshToken = $tenantBRefresh }
  $refreshInfo = Extract-Login $refreshB
  $replayRefresh = Invoke-Api -Name "tenant-b-refresh-replay" -Method "POST" -Path "/api/v1/auth/refresh" -Data @{ refreshToken = $tenantBRefresh }
  Add-Result "refresh-rotation" "new pair issued and old refresh replay rejected" ([pscustomobject]@{ first = Summarize $refreshB; replay = Summarize $replayRefresh; newTokenPresent = $refreshInfo.access.Length -gt 0 }) ($refreshB.status -eq 200 -and [int]$refreshB.payload.code -eq 200 -and $refreshInfo.access.Length -gt 0 -and ($replayRefresh.status -ge 400 -or [int]$replayRefresh.payload.code -ge 400)) "refresh token rotation"
  if ($refreshInfo.access.Length -gt 0) {
    $tenantBToken = $refreshInfo.access
    $tenantBRefresh = $refreshInfo.refresh
    $tenantBCsrf = $refreshInfo.csrf
  }

  Start-Sleep -Seconds 2
  $auditA = Invoke-Api -Name "tenant-a-operation-log" -Method "GET" -Path "/api/v1/system/operation-log/list?page=1&pageSize=100" -Token $tenantAToken
  $auditB = Invoke-Api -Name "tenant-b-operation-log" -Method "GET" -Path "/api/v1/system/operation-log/list?page=1&pageSize=100" -Token $tenantBToken
  $auditAIds = @($auditA.payload.data.items | ForEach-Object { [int64]$_.tenantId } | Sort-Object -Unique)
  $auditBIds = @($auditB.payload.data.items | ForEach-Object { [int64]$_.tenantId } | Sort-Object -Unique)
  Add-Result "audit-tenant-a" "operation log rows stay in tenant A" (Summarize $auditA) ($auditA.status -eq 200 -and (($auditAIds | Where-Object { $_ -ne 101 }).Count -eq 0)) "audit list and aggregate"
  Add-Result "audit-tenant-b" "operation log rows stay in tenant B" (Summarize $auditB) ($auditB.status -eq 200 -and (($auditBIds | Where-Object { $_ -ne 202 }).Count -eq 0)) "audit list and aggregate"

  $filePathTamper = Invoke-Api -Name "tenant-a-file-namespace-tamper" -Method "GET" -Path "/api/v1/system/upload/files/t202/not-found.txt" -Token $tenantAToken
  Add-Result "file-namespace-tamper" "cross-tenant object namespace is rejected" (Summarize $filePathTamper) ($filePathTamper.status -ge 400 -or [int]$filePathTamper.payload.code -ge 400) "t202 path probe"

  $logoutA = Invoke-Api -Name "tenant-a-logout" -Method "POST" -Path "/api/v1/auth/logout" -Token $tenantAToken -Csrf $tenantACsrf
  $meAfterLogout = Invoke-Api -Name "tenant-a-me-after-logout" -Method "GET" -Path "/api/v1/auth/me" -Token $tenantAToken
  Add-Result "logout-revocation" "logout succeeds and old access token is rejected" ([pscustomobject]@{ logout = Summarize $logoutA; after = Summarize $meAfterLogout }) ($logoutA.status -eq 200 -and [int]$logoutA.payload.code -eq 200 -and ($meAfterLogout.status -ge 400 -or [int]$meAfterLogout.payload.code -ge 400)) "session revocation"

  $revokeOutput = & $tenantMatrix revoke 2>&1
  $revokeExit = $LASTEXITCODE
  $meAfterKill = Invoke-Api -Name "tenant-b-me-after-kill-switch" -Method "GET" -Path "/api/v1/auth/me" -Token $tenantBToken
  Add-Result "kill-switch" "revoke command succeeds and live access token is force-expired" ([pscustomobject]@{ exitCode = $revokeExit; output = ($revokeOutput -join " "); after = Summarize $meAfterKill }) ($revokeExit -eq 0 -and ($meAfterKill.status -ge 400 -or [int]$meAfterKill.payload.code -ge 400)) "user blacklist plus DB session revocation"
} catch {
  Add-Result "harness-error" "no harness setup or execution error" ([pscustomobject]@{ error = $_.Exception.Message }) $false "classify before product conclusion"
} finally {
  try {
    Invoke-Sql "UPDATE system_setting SET setting_value='compat' WHERE setting_key='platform.tenant_mode'"
    Start-Sleep -Seconds 6
    Add-Result "flag-rollback" "platform.tenant_mode restored to compat" "compat" $true "finally"
  } catch {
    Add-Result "flag-rollback" "platform.tenant_mode restored to compat" ([pscustomobject]@{ error = $_.Exception.Message }) $false "finally"
  }
  try {
    Invoke-Sql "DELETE FROM system_dict_item WHERE dict_code IN ('$dictA','$dictB'); DELETE FROM system_dict_type WHERE dict_code IN ('$dictA','$dictB')"
    Add-Result "fixture-cleanup" "temporary dict rows removed" ([pscustomobject]@{ dictA = $dictA; dictB = $dictB }) $true "finally"
  } catch {
    Add-Result "fixture-cleanup" "temporary dict rows removed" ([pscustomobject]@{ error = $_.Exception.Message }) $false "finally"
  }
  try {
    if (Test-Path $tenantMatrix) {
      $unblacklistOutput = & $tenantMatrix unblacklist 2>&1
      Add-Result "kill-switch-cleanup" "local blacklist rehearsal key removed" ($unblacklistOutput -join " ") $true "finally"
    }
  } catch {
    Add-Result "kill-switch-cleanup" "local blacklist rehearsal key removed" ([pscustomobject]@{ error = $_.Exception.Message }) $false "finally"
  }
}

$runFinished = (Get-Date).ToUniversalTime().ToString("o")
$passed = @($results | Where-Object { -not $_.passed }).Count -eq 0
$report = [pscustomobject]@{
  taskId = "2026-09-10-tenant-verification-and-gray"
  harness = "tenant-runtime-matrix.ps1"
  startedAt = $runStarted
  finishedAt = $runFinished
  baseUrl = $BaseUrl
  tenants = @(101, 202)
  fixtureCodes = @($dictA, $dictB)
  passed = $passed
  resultCount = $results.Count
  failedCount = @($results | Where-Object { -not $_.passed }).Count
  results = $results
}
$report | ConvertTo-Json -Depth 12 | Set-Content -Path $OutFile -Encoding UTF8
if (-not $passed) {
  exit 1
}
