$baseUrl = "http://localhost/gov/api/v1"

function Test-Endpoint {
    param($name, [scriptblock]$action)
    try {
        $result = & $action
        Write-Host " [PASS] $name" -ForegroundColor Green
        return $result
    } catch {
        Write-Host " [FAIL] $name : $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) { Write-Host "        Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow }
        return $null
    }
}

Write-Host "=== BAT DAU KIEM THU API TAI KHOAN CONG DAN ===" -ForegroundColor Cyan

# 1. Login demo account
$loginRes = Test-Endpoint "Dang nhap tai khoan cong dan mau (CCCD/Pass)" {
    Invoke-RestMethod -Uri "$baseUrl/citizen/auth/login" -Method Post -ContentType "application/json" -Body (@{
        identifier = "015088006677"
        password = "Congdan@123"
    } | ConvertTo-Json)
}

$token = $loginRes.data.token
Write-Host "Token: $($token.Substring(0, 20))..."

# 2. Login with phone
Test-Endpoint "Dang nhap tai khoan cong dan mau (SDT/Pass)" {
    Invoke-RestMethod -Uri "$baseUrl/citizen/auth/login" -Method Post -ContentType "application/json" -Body (@{
        identifier = "0966554433"
        password = "Congdan@123"
    } | ConvertTo-Json)
}

# 3. /me
$meRes = Test-Endpoint "Lay thong tin ca nhan cong dan (/me)" {
    Invoke-RestMethod -Uri "$baseUrl/citizen/auth/me" -Method Get -Headers @{ Authorization = "Bearer $token" }
}
Write-Host "Ho va ten: $($meRes.data.full_name)"

# 4. Summary
$summaryRes = Test-Endpoint "Lay tong quan Dashboard cong dan (/summary)" {
    Invoke-RestMethod -Uri "$baseUrl/citizen/summary" -Method Get -Headers @{ Authorization = "Bearer $token" }
}
Write-Host "Tong so ho so: $($summaryRes.data.application_stats.total)"

# 5. List applications
$appsRes = Test-Endpoint "Lay danh sach Ho so cua toi (/citizen/applications)" {
    Invoke-RestMethod -Uri "$baseUrl/citizen/applications" -Method Get -Headers @{ Authorization = "Bearer $token" }
}
Write-Host "So ho so tra ve: $($appsRes.data.items.Count)"

# 6. Block citizen token on staff API
Test-Endpoint "Token cong dan bi chan khi goi API can bo (/dashboard/stats)" {
    try {
        Invoke-RestMethod -Uri "$baseUrl/dashboard/stats" -Method Get -Headers @{ Authorization = "Bearer $token" }
        throw "Le ra phai bi chan 401/403"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401 -or $_.Exception.Response.StatusCode.value__ -eq 403) {
            return "Chan thanh cong (HTTP $($_.Exception.Response.StatusCode.value__))"
        }
        throw $_
    }
}

# 7. Anonymous track by CCCD must be rejected with 403
Test-Endpoint "Tra cuu an danh bang CCCD bi tu choi va huong dan dang nhap" {
    try {
        Invoke-RestMethod -Uri "$baseUrl/applications/track?code=015088006677" -Method Get
        throw "Le ra phai bi tu choi 403"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 403) {
            return "Bi tu choi bao mat dung (HTTP 403)"
        }
        throw $_
    }
}

# 8. Anonymous track by valid dossier code succeeds
Test-Endpoint "Tra cuu an danh bang Ma ho so thanh cong" {
    Invoke-RestMethod -Uri "$baseUrl/applications/track?code=000.00.00.H49-261006-0003" -Method Get
}

# 9. Forgot password and OTP
$forgotRes = Test-Endpoint "Yeu cau ma OTP quen mat khau" {
    Invoke-RestMethod -Uri "$baseUrl/citizen/auth/forgot-password" -Method Post -ContentType "application/json" -Body (@{
        identifier = "015088006677"
    } | ConvertTo-Json)
}
Write-Host "Ma OTP demo thu duoc: $($forgotRes.data.demo_code)"

Write-Host "=== HOAN TAT KIEM THU API ===" -ForegroundColor Cyan
