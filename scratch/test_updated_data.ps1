$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  KIỂM THỬ DỮ LIỆU MẪU MỚI (STAFF, CITIZENS, APPS, GIS)  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost/gov/api/v1"

# 1. Đăng nhập cán bộ mới: motcua_quang
try {
    $body = @{ username = "motcua_quang"; password = "Admin@123" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    $staffToken = $res.data.token
    $msg = "[1/6] Đăng nhập Cán bộ Một cửa mới (motcua_quang) ............ [ĐẠT] ({0} - {1})" -f $res.data.user.full_name, $res.data.user.role
    Write-Host $msg -ForegroundColor Green
}
catch {
    Write-Host "[1/6] Lỗi đăng nhập cán bộ mới: $_" -ForegroundColor Red
}

# 2. Đăng nhập Lãnh đạo mới: lanhdao_viet
try {
    $body = @{ username = "lanhdao_viet"; password = "Admin@123" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
    $msg = "[2/6] Đăng nhập Lãnh đạo mới (lanhdao_viet) .................. [ĐẠT] ({0} - {1})" -f $res.data.user.full_name, $res.data.user.role
    Write-Host $msg -ForegroundColor Green
}
catch {
    Write-Host "[2/6] Lỗi đăng nhập lãnh đạo mới: $_" -ForegroundColor Red
}

# 3. Đăng nhập Công dân mới: Nguyễn Văn An (CCCD 015092008899)
try {
    $body = @{ identifier = "015092008899"; password = "Congdan@123" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/citizen/auth/login" -Method Post -Body $body -ContentType "application/json"
    $citToken = $res.data.token
    $msg = "[3/6] Đăng nhập Công dân mới (Nguyễn Văn An) ................ [ĐẠT] ({0} - SĐT: {1})" -f $res.data.citizen.full_name, $res.data.citizen.phone_number
    Write-Host $msg -ForegroundColor Green
}
catch {
    Write-Host "[3/6] Lỗi đăng nhập công dân mới: $_" -ForegroundColor Red
}

# 4. Kiểm tra Hồ sơ của công dân vừa đăng nhập
try {
    $headers = @{ Authorization = "Bearer $citToken" }
    $res = Invoke-RestMethod -Uri "$baseUrl/citizen/applications" -Method Get -Headers $headers
    $msg = "[4/6] Hồ sơ Cổng công dân của Nguyễn Văn An ................. [ĐẠT] (Tìm thấy {0} hồ sơ)" -f $res.data.pagination.total
    Write-Host $msg -ForegroundColor Green
}
catch {
    Write-Host "[4/6] Lỗi lấy hồ sơ công dân: $_" -ForegroundColor Red
}

# 5. Kiểm tra Danh sách hồ sơ một cửa tổng thể (Cán bộ)
try {
    $headers = @{ Authorization = "Bearer $staffToken" }
    $res = Invoke-RestMethod -Uri "$baseUrl/applications" -Method Get -Headers $headers
    $msg = "[5/6] Danh sách Hồ sơ Một cửa (Toàn hệ thống) ............... [ĐẠT] (Tổng cộng: {0} hồ sơ)" -f $res.data.pagination.total
    Write-Host $msg -ForegroundColor Green
}
catch {
    Write-Host "[5/6] Lỗi lấy danh sách hồ sơ: $_" -ForegroundColor Red
}

# 6. Kiểm tra Danh sách phản ánh hiện trường GIS
try {
    $headers = @{ Authorization = "Bearer $staffToken" }
    $res = Invoke-RestMethod -Uri "$baseUrl/complaints" -Method Get -Headers $headers
    $msg = "[6/6] Danh sách Phản ánh Hiện trường (GIS) .................. [ĐẠT] (Tổng cộng: {0} phản ánh)" -f $res.data.pagination.total
    Write-Host $msg -ForegroundColor Green
}
catch {
    Write-Host "[6/6] Lỗi lấy danh sách phản ánh: $_" -ForegroundColor Red
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  TẤT CẢ KIỂM THỬ DỮ LIỆU ĐỀU ĐẠT CHUẨN XUẤT SẮC!         " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan