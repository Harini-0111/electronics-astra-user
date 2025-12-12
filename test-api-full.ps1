# API Testing Commands - Copy & Paste Ready

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Dual-Database API Testing Commands" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5001"

# Test 1: Health Check
Write-Host "[TEST 1] Health Check (No Auth)" -ForegroundColor Yellow
Write-Host "Command:" -ForegroundColor Gray
Write-Host "  curl $baseUrl/api/health" -ForegroundColor White
Write-Host ""
Write-Host "Executing..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get
    Write-Host "✓ SUCCESS" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10) -ForegroundColor Gray
} catch {
    Write-Host "✗ FAILED: $_" -ForegroundColor Red
}
Write-Host "`n" + ("="*50) + "`n"

# Test 2: Register (if needed)
Write-Host "[TEST 2] Register New User (Optional)" -ForegroundColor Yellow
Write-Host "Command:" -ForegroundColor Gray
Write-Host '  curl -X POST $baseUrl/api/auth/register \' -ForegroundColor White
Write-Host '    -H "Content-Type: application/json" \' -ForegroundColor White
Write-Host '    -d "{"email":"testuser@example.com","password":"Test1234!","name":"Test User"}"' -ForegroundColor White
Write-Host ""
Write-Host "Skipping (use if you need a test account)" -ForegroundColor Yellow
Write-Host "`n" + ("="*50) + "`n"

# Test 3: Login
Write-Host "[TEST 3] Login & Get Session" -ForegroundColor Yellow
Write-Host "Enter your credentials:" -ForegroundColor Cyan
$email = Read-Host "Email"
$password = Read-Host "Password" -AsSecureString
$passwordText = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

Write-Host "`nCommand:" -ForegroundColor Gray
Write-Host "  curl -X POST $baseUrl/api/auth/login -H 'Content-Type: application/json' -d '{...}'" -ForegroundColor White
Write-Host ""
Write-Host "Executing..." -ForegroundColor Cyan

try {
    $loginBody = @{
        email = $email
        password = $passwordText
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody `
        -SessionVariable session

    Write-Host "✓ LOGIN SUCCESS" -ForegroundColor Green
    $loginData = $loginResponse.Content | ConvertFrom-Json
    Write-Host ($loginData | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    
    $cookies = $session.Cookies.GetCookies($baseUrl)
    Write-Host "`n✓ Session cookie saved" -ForegroundColor Green
    
} catch {
    Write-Host "✗ LOGIN FAILED: $_" -ForegroundColor Red
    Write-Host "Make sure you have a valid account or create one first" -ForegroundColor Yellow
    exit
}
Write-Host "`n" + ("="*50) + "`n"

# Test 4: Upload File
Write-Host "[TEST 4] Upload File to GridFS" -ForegroundColor Yellow

# Create test file
$testContent = "This is a test file for MongoDB GridFS storage.`nCreated at: $(Get-Date)"
$testContent | Out-File -FilePath "test-upload.txt" -Encoding UTF8

Write-Host "Created test file: test-upload.txt" -ForegroundColor Green
Write-Host "`nCommand:" -ForegroundColor Gray
Write-Host '  curl -X POST $baseUrl/api/student/library/upload \' -ForegroundColor White
Write-Host '    -b cookies.txt \' -ForegroundColor White
Write-Host '    -F "file=@test-upload.txt"' -ForegroundColor White
Write-Host ""
Write-Host "Executing..." -ForegroundColor Cyan

try {
    $boundary = [System.Guid]::NewGuid().ToString()
    $filePath = "test-upload.txt"
    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
    $fileName = [System.IO.Path]::GetFileName($filePath)
    
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
        "Content-Type: text/plain",
        "",
        [System.Text.Encoding]::UTF8.GetString($fileBytes),
        "--$boundary--"
    ) -join "`r`n"

    $uploadResponse = Invoke-WebRequest -Uri "$baseUrl/api/student/library/upload" `
        -Method Post `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body $bodyLines `
        -WebSession $session

    Write-Host "✓ UPLOAD SUCCESS" -ForegroundColor Green
    $uploadData = $uploadResponse.Content | ConvertFrom-Json
    Write-Host ($uploadData | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    
    $fileId = $uploadData.data._id
    Write-Host "`n✓ File ID: $fileId" -ForegroundColor Green
    
} catch {
    Write-Host "✗ UPLOAD FAILED: $_" -ForegroundColor Red
}
Write-Host "`n" + ("="*50) + "`n"

# Test 5: Get All Files
Write-Host "[TEST 5] Get All Library Files" -ForegroundColor Yellow
Write-Host "Command:" -ForegroundColor Gray
Write-Host "  curl $baseUrl/api/student/library" -ForegroundColor White
Write-Host ""
Write-Host "Executing..." -ForegroundColor Cyan

try {
    $filesResponse = Invoke-WebRequest -Uri "$baseUrl/api/student/library" `
        -Method Get `
        -WebSession $session

    Write-Host "✓ SUCCESS" -ForegroundColor Green
    $filesData = $filesResponse.Content | ConvertFrom-Json
    Write-Host "Found $($filesData.data.Count) file(s)" -ForegroundColor Green
    Write-Host ($filesData | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    
} catch {
    Write-Host "✗ FAILED: $_" -ForegroundColor Red
}
Write-Host "`n" + ("="*50) + "`n"

# Test 6: Get My Uploads
Write-Host "[TEST 6] Get My Uploads" -ForegroundColor Yellow
Write-Host "Command:" -ForegroundColor Gray
Write-Host "  curl $baseUrl/api/student/library/my-uploads" -ForegroundColor White
Write-Host ""
Write-Host "Executing..." -ForegroundColor Cyan

try {
    $myUploadsResponse = Invoke-WebRequest -Uri "$baseUrl/api/student/library/my-uploads" `
        -Method Get `
        -WebSession $session

    Write-Host "✓ SUCCESS" -ForegroundColor Green
    $myUploadsData = $myUploadsResponse.Content | ConvertFrom-Json
    Write-Host "You have uploaded $($myUploadsData.data.Count) file(s)" -ForegroundColor Green
    Write-Host ($myUploadsData | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    
} catch {
    Write-Host "✗ FAILED: $_" -ForegroundColor Red
}
Write-Host "`n" + ("="*50) + "`n"

# Test 7: Download File
if ($fileId) {
    Write-Host "[TEST 7] Download File from GridFS" -ForegroundColor Yellow
    Write-Host "Command:" -ForegroundColor Gray
    Write-Host "  curl `"$baseUrl/api/student/library/$fileId/download`" -o downloaded.txt" -ForegroundColor White
    Write-Host ""
    Write-Host "Executing..." -ForegroundColor Cyan

    try {
        $downloadResponse = Invoke-WebRequest -Uri "$baseUrl/api/student/library/$fileId/download" `
            -Method Get `
            -WebSession $session `
            -OutFile "downloaded-test.txt"

        Write-Host "✓ DOWNLOAD SUCCESS" -ForegroundColor Green
        Write-Host "File saved as: downloaded-test.txt" -ForegroundColor Green
        
        # Verify content
        $downloadedContent = Get-Content "downloaded-test.txt" -Raw
        Write-Host "`nDownloaded content:" -ForegroundColor Cyan
        Write-Host $downloadedContent -ForegroundColor Gray
        
    } catch {
        Write-Host "✗ DOWNLOAD FAILED: $_" -ForegroundColor Red
    }
    Write-Host "`n" + ("="*50) + "`n"
}

# Test 8: Share File
if ($fileId) {
    Write-Host "[TEST 8] Share File with Friend (Optional)" -ForegroundColor Yellow
    Write-Host "Enter friend's userid (5-digit number) or press Enter to skip:" -ForegroundColor Cyan
    $targetUserId = Read-Host "Friend's userid"
    
    if ($targetUserId) {
        Write-Host "`nCommand:" -ForegroundColor Gray
        Write-Host '  curl -X POST $baseUrl/api/student/library/share \' -ForegroundColor White
        Write-Host '    -H "Content-Type: application/json" \' -ForegroundColor White
        Write-Host '    -d "{"fileId":"...","targetUserId":"..."}"' -ForegroundColor White
        Write-Host ""
        Write-Host "Executing..." -ForegroundColor Cyan

        try {
            $shareBody = @{
                fileId = $fileId
                targetUserId = $targetUserId
            } | ConvertTo-Json

            $shareResponse = Invoke-WebRequest -Uri "$baseUrl/api/student/library/share" `
                -Method Post `
                -ContentType "application/json" `
                -Body $shareBody `
                -WebSession $session

            Write-Host "✓ SHARE SUCCESS" -ForegroundColor Green
            $shareData = $shareResponse.Content | ConvertFrom-Json
            Write-Host ($shareData | ConvertTo-Json -Depth 10) -ForegroundColor Gray
            
        } catch {
            Write-Host "✗ SHARE FAILED: $_" -ForegroundColor Red
            Write-Host "Make sure the target userid exists in your database" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Skipped" -ForegroundColor Yellow
    }
    Write-Host "`n" + ("="*50) + "`n"
}

# Test 9: Get Shared Files
Write-Host "[TEST 9] Get Files Shared With Me" -ForegroundColor Yellow
Write-Host "Command:" -ForegroundColor Gray
Write-Host "  curl $baseUrl/api/student/library/shared-with-me" -ForegroundColor White
Write-Host ""
Write-Host "Executing..." -ForegroundColor Cyan

try {
    $sharedResponse = Invoke-WebRequest -Uri "$baseUrl/api/student/library/shared-with-me" `
        -Method Get `
        -WebSession $session

    Write-Host "✓ SUCCESS" -ForegroundColor Green
    $sharedData = $sharedResponse.Content | ConvertFrom-Json
    Write-Host "$($sharedData.data.Count) file(s) shared with you" -ForegroundColor Green
    Write-Host ($sharedData | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    
} catch {
    Write-Host "✗ FAILED: $_" -ForegroundColor Red
}
Write-Host "`n" + ("="*50) + "`n"

# Summary
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  TESTING COMPLETE" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ All tests executed" -ForegroundColor Green
Write-Host "✓ Files created:" -ForegroundColor Green
Write-Host "  - test-upload.txt (original)" -ForegroundColor Gray
Write-Host "  - downloaded-test.txt (from GridFS)" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check MongoDB Atlas dashboard for uploaded files" -ForegroundColor White
Write-Host "2. Verify GridFS collections: library_files.files and library_files.chunks" -ForegroundColor White
Write-Host "3. Test frontend Library page with UI" -ForegroundColor White
Write-Host ""
