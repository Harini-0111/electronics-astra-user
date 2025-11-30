$ErrorActionPreference = 'Stop'
$ts=(Get-Date -UFormat %s)
$e1 = "ui1_$ts@example.test"
$e2 = "ui2_$ts@example.test"
Write-Output "Registering $e1"
$payload = @"
{"name":"UI Test1","email":"$e1","password":"Password123"}
"@
curl.exe -s -X POST http://localhost:5001/api/auth/register -H "Content-Type: application/json" -d $payload | Write-Output
Start-Sleep -Milliseconds 300
Write-Output "Registering $e2"
$payload = @"
{"name":"UI Test2","email":"$e2","password":"Password123"}
"@
curl.exe -s -X POST http://localhost:5001/api/auth/register -H "Content-Type: application/json" -d $payload | Write-Output
Start-Sleep -Milliseconds 300
Write-Output "Fetching OTP for $e1"
$info1_raw = node backend/scripts/getOtpAndUserid.js $e1 | Out-String
$lines1 = $info1_raw -split "\r?\n"
$last1 = $lines1[-1].Trim()
Write-Output "INFO1_RAW: $info1_raw"
Write-Output "INFO1_LAST: $last1"
$js1 = $last1 | ConvertFrom-Json
$otp1 = $js1.otp
$uid1 = $js1.userid
if (!$otp1) { Write-Error "OTP for $e1 not found" }
Write-Output "Verifying OTP for $e1 -> $otp1"
$payload = @"
{"email":"$e1","otp":"$otp1"}
"@
curl.exe -s -X POST http://localhost:5001/api/auth/verify-otp -H "Content-Type: application/json" -d $payload | Write-Output
Start-Sleep -Milliseconds 300
Write-Output "Fetching OTP for $e2"
$info2_raw = node backend/scripts/getOtpAndUserid.js $e2 | Out-String
$lines2 = $info2_raw -split "\r?\n"
$last2 = $lines2[-1].Trim()
Write-Output "INFO2_RAW: $info2_raw"
Write-Output "INFO2_LAST: $last2"
$js2 = $last2 | ConvertFrom-Json
$otp2 = $js2.otp
$uid2 = $js2.userid
if (!$otp2) { Write-Error "OTP for $e2 not found" }
Write-Output "Verifying OTP for $e2 -> $otp2"
$payload = @"
{"email":"$e2","otp":"$otp2"}
"@
curl.exe -s -X POST http://localhost:5001/api/auth/verify-otp -H "Content-Type: application/json" -d $payload | Write-Output
Start-Sleep -Milliseconds 300
Write-Output "Logging in as $e1"
$payload = @"
{"email":"$e1","password":"Password123"}
"@
curl.exe -c cookie.txt -s -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d $payload | Write-Output
Start-Sleep -Milliseconds 300
Write-Output "Fetching profile for logged in user"
$profile = curl.exe -b cookie.txt -s http://localhost:5001/profile | Out-String
Write-Output "PROFILE: $profile"
Start-Sleep -Milliseconds 300
Write-Output "Add friend (target uid: $uid2)"
$payload = @"
{"targetUserId":$uid2}
"@
curl.exe -b cookie.txt -s -X POST http://localhost:5001/add-friend -H "Content-Type: application/json" -d $payload | Write-Output
Start-Sleep -Milliseconds 300
Write-Output "Accept friend (target uid: $uid2)"
$payload = @"
{"targetUserId":$uid2}
"@
curl.exe -b cookie.txt -s -X POST http://localhost:5001/accept-friend -H "Content-Type: application/json" -d $payload | Write-Output
Write-Output "Done"
