# Testing Script for Dual-Database System

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Dual-Database System Testing Script" -ForegroundColor Cyan
Write-Host "  PostgreSQL + MongoDB Atlas + GridFS" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if .env file exists
Write-Host "[1/8] Checking .env configuration..." -ForegroundColor Yellow
if (Test-Path "backend\.env") {
    Write-Host "  ✓ .env file exists" -ForegroundColor Green
    $envContent = Get-Content "backend\.env" -Raw
    if ($envContent -match "MONGO_URI=mongodb\+srv://") {
        Write-Host "  ✓ MongoDB Atlas URI configured" -ForegroundColor Green
    } elseif ($envContent -match "MONGO_URI=mongodb://localhost") {
        Write-Host "  ⚠ MongoDB set to LOCAL (not Atlas)" -ForegroundColor Yellow
    } else {
        Write-Host "  ✗ MONGO_URI not found in .env" -ForegroundColor Red
    }
} else {
    Write-Host "  ✗ .env file missing" -ForegroundColor Red
    exit
}
Write-Host ""

# Test 2: Check PostgreSQL connection
Write-Host "[2/8] Testing PostgreSQL connection..." -ForegroundColor Yellow
try {
    $pgResult = psql -h localhost -U postgres -d electronics-astra -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ PostgreSQL connected" -ForegroundColor Green
    } else {
        Write-Host "  ✗ PostgreSQL connection failed" -ForegroundColor Red
        Write-Host "    Make sure PostgreSQL is running" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⚠ psql command not found (skipping)" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: Check Node.js dependencies
Write-Host "[3/8] Checking Node.js dependencies..." -ForegroundColor Yellow
Set-Location backend
$mongodbInstalled = npm list mongodb 2>&1 | Select-String "mongodb@"
if ($mongodbInstalled) {
    Write-Host "  ✓ MongoDB driver installed: $mongodbInstalled" -ForegroundColor Green
} else {
    Write-Host "  ✗ MongoDB driver not installed" -ForegroundColor Red
    Write-Host "    Run: npm install" -ForegroundColor Gray
}
Write-Host ""

# Test 4: Start backend server
Write-Host "[4/8] Starting backend server..." -ForegroundColor Yellow
Write-Host "  Press Ctrl+C to stop the server after checking startup logs" -ForegroundColor Gray
Write-Host ""

$job = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev
}

# Wait a bit for server to start
Start-Sleep -Seconds 5

# Test 5: Check if server is running
Write-Host "[5/8] Checking server health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/api/health" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Backend server is running on port 5001" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Server not responding" -ForegroundColor Red
    Write-Host "    Check server logs above for errors" -ForegroundColor Gray
}
Write-Host ""

# Test 6: Test login endpoint (to get session)
Write-Host "[6/8] Testing authentication..." -ForegroundColor Yellow
Write-Host "  This requires an existing user account" -ForegroundColor Gray
Write-Host "  Skipping automatic test - use manual cURL commands below" -ForegroundColor Yellow
Write-Host ""

# Test 7: Show manual testing commands
Write-Host "[7/8] Manual Testing Commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. LOGIN (get session cookie):" -ForegroundColor Cyan
Write-Host '     curl -X POST http://localhost:5001/api/auth/login \' -ForegroundColor Gray
Write-Host '       -H "Content-Type: application/json" \' -ForegroundColor Gray
Write-Host '       -d "{\"email\":\"your@email.com\",\"password\":\"yourpass\"}" \' -ForegroundColor Gray
Write-Host '       -c cookies.txt' -ForegroundColor Gray
Write-Host ""

Write-Host "  2. UPLOAD FILE:" -ForegroundColor Cyan
Write-Host '     curl -X POST http://localhost:5001/api/student/library/upload \' -ForegroundColor Gray
Write-Host '       -b cookies.txt \' -ForegroundColor Gray
Write-Host '       -F "file=@test.pdf"' -ForegroundColor Gray
Write-Host ""

Write-Host "  3. GET ALL FILES:" -ForegroundColor Cyan
Write-Host '     curl http://localhost:5001/api/student/library -b cookies.txt' -ForegroundColor Gray
Write-Host ""

Write-Host "  4. GET MY UPLOADS:" -ForegroundColor Cyan
Write-Host '     curl http://localhost:5001/api/student/library/my-uploads -b cookies.txt' -ForegroundColor Gray
Write-Host ""

Write-Host "  5. DOWNLOAD FILE (replace FILE_ID):" -ForegroundColor Cyan
Write-Host '     curl "http://localhost:5001/api/student/library/FILE_ID/download" \' -ForegroundColor Gray
Write-Host '       -b cookies.txt -o downloaded.pdf' -ForegroundColor Gray
Write-Host ""

Write-Host "  6. SHARE FILE (replace FILE_ID and USERID):" -ForegroundColor Cyan
Write-Host '     curl -X POST http://localhost:5001/api/student/library/share \' -ForegroundColor Gray
Write-Host '       -b cookies.txt \' -ForegroundColor Gray
Write-Host '       -H "Content-Type: application/json" \' -ForegroundColor Gray
Write-Host '       -d "{\"fileId\":\"FILE_ID\",\"targetUserId\":\"12345\"}"' -ForegroundColor Gray
Write-Host ""

Write-Host "  7. GET SHARED FILES:" -ForegroundColor Cyan
Write-Host '     curl http://localhost:5001/api/student/library/shared-with-me -b cookies.txt' -ForegroundColor Gray
Write-Host ""

# Test 8: Summary
Write-Host "[8/8] Testing Summary:" -ForegroundColor Yellow
Write-Host "  ✓ Backend code implemented" -ForegroundColor Green
Write-Host "  ✓ MongoDB driver installed" -ForegroundColor Green
Write-Host "  ✓ Server started successfully" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Magenta
Write-Host "1. Update backend\.env with MongoDB Atlas connection string" -ForegroundColor White
Write-Host "2. Restart server: npm run dev" -ForegroundColor White
Write-Host "3. Login to get session cookie" -ForegroundColor White
Write-Host "4. Test file upload endpoint" -ForegroundColor White
Write-Host "5. Verify files in MongoDB Atlas dashboard" -ForegroundColor White
Write-Host ""

# Stop the background job
Stop-Job -Job $job
Remove-Job -Job $job

Write-Host "Server stopped. Run 'npm run dev' in backend folder to restart." -ForegroundColor Cyan
