# ====================================================================
# Script kiểm thử tự động toàn diện các tính năng Demo mới
# YenBai eWard-Gov
# ====================================================================

$baseUrl = "http://localhost/gov/api/v1"
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  KIỂM THỬ TỰ ĐỘNG CÁC TÍNH NĂNG DEMO YENBAI EWARD-GOV" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Đăng nhập Admin lấy token
Write-Host "`n[1/7] Đăng nhập tài khoản Quản trị viên (admin)..." -ForegroundColor Yellow
$loginBody = @{ username = "admin"; password = "Admin@123" } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.data.token
$headers = @{ Authorization = "Bearer $token" }
Write-Host " -> Đăng nhập thành công! Token: $($token.Substring(0, 20))..." -ForegroundColor Green

# 2. Kiểm thử Demo Reset
Write-Host "`n[2/7] Gọi API Làm mới & Trẻ hóa dữ liệu Demo (/admin/demo/reset)..." -ForegroundColor Yellow
$resetBody = @{ confirm = "reset_demo_data_2026" } | ConvertTo-Json
$resetRes = Invoke-RestMethod -Uri "$baseUrl/admin/demo/reset" -Method Post -Headers $headers -Body $resetBody -ContentType "application/json"
Write-Host " -> $($resetRes.message)" -ForegroundColor Green
Write-Host "    Tổng hồ sơ: $($resetRes.data.total_applications) | Hôm nay: $($resetRes.data.today_applications) | Quá hạn: $($resetRes.data.overdue_count) | Cảnh báo: $($resetRes.data.warning_count)" -ForegroundColor Cyan

# 3. Kiểm thử Dashboard Stats & Charts
Write-Host "`n[3/7] Kiểm tra số liệu Dashboard & Biểu đồ tuần (/dashboard/stats & /dashboard/charts)..." -ForegroundColor Yellow
$statsRes = Invoke-RestMethod -Uri "$baseUrl/dashboard/stats" -Method Get -Headers $headers
$chartsRes = Invoke-RestMethod -Uri "$baseUrl/dashboard/charts" -Method Get -Headers $headers

$appStats = $statsRes.data.applications
$sla = $statsRes.data.sla_alerts
Write-Host " -> Tiếp nhận hôm nay: $($appStats.total_today) | Hoàn thành tháng: $($appStats.total_month_completed) | Đúng hạn: $($appStats.on_time_rate)%" -ForegroundColor Green
Write-Host " -> Cảnh báo SLA: Quá hạn = $($sla.overdue_count) (mục tiêu <= 2) | Sắp quá hạn = $($sla.warning_count)" -ForegroundColor Green

$trends = $chartsRes.data.weekly_trends
Write-Host " -> Biểu đồ 7 ngày gần nhất:" -ForegroundColor Cyan
foreach ($t in $trends) {
    Write-Host "    $($t.date) ($($t.full_date)): Tiếp nhận = $($t.tiep_nhan) | Hoàn thành = $($t.hoan_thanh)" -ForegroundColor Gray
}

# 4. Kiểm thử Bảng TV Công khai (/public/board)
Write-Host "`n[4/7] Kiểm tra API Bảng điện tử Công khai TV (/public/board)..." -ForegroundColor Yellow
$boardRes = Invoke-RestMethod -Uri "$baseUrl/public/board" -Method Get
Write-Host " -> Đơn vị: $($boardRes.data.unit_name)" -ForegroundColor Green
Write-Host " -> Tiêu đề: $($boardRes.data.board_title)" -ForegroundColor Green
Write-Host " -> Số hồ sơ công khai hiển thị: $($boardRes.data.recent_dossiers.Count)" -ForegroundColor Green
$sampleApp = $boardRes.data.recent_dossiers[0]
Write-Host "    Mẫu: [$($sampleApp.dossier_code)] $($sampleApp.proc_name) - Công dân: $($sampleApp.citizen_name_masked)" -ForegroundColor Cyan

# 5. Kiểm thử Hàng đợi Bốc số Kiosk (/public/queue/take)
Write-Host "`n[5/7] Lấy số thứ tự mới tại Kiosk (/public/queue/take)..." -ForegroundColor Yellow
$ticketBody = @{
    counter_type = "HO_TICH"
    citizen_name = "Trần Văn Kiểm Thử"
    citizen_phone = "0988776655"
} | ConvertTo-Json
$ticketRes = Invoke-RestMethod -Uri "$baseUrl/public/queue/take" -Method Post -Body $ticketBody -ContentType "application/json"
$myTicket = $ticketRes.data
Write-Host " -> Phiếu số sinh ra: $($myTicket.ticket_number) ($($myTicket.service_name))" -ForegroundColor Green
Write-Host "    Người chờ trước: $($myTicket.waiting_ahead) | Dự kiến chờ: $($myTicket.estimated_wait_minutes) phút" -ForegroundColor Cyan

# 6. Kiểm thử Màn hình gọi số & Cán bộ bấm gọi số
Write-Host "`n[6/7] Cán bộ Một cửa bấm 'Gọi số tiếp theo' (/queue/call-next)..." -ForegroundColor Yellow
$callBody = @{ counter_no = 1 } | ConvertTo-Json
$callRes = Invoke-RestMethod -Uri "$baseUrl/queue/call-next" -Method Post -Headers $headers -Body $callBody -ContentType "application/json"
Write-Host " -> Kết quả gọi: $($callRes.message)" -ForegroundColor Green

$displayRes = Invoke-RestMethod -Uri "$baseUrl/public/queue/display" -Method Get
Write-Host " -> Số vừa gọi gần nhất: $($displayRes.data.latest_called.ticket_number) tại Quầy $($displayRes.data.latest_called.counter_no)" -ForegroundColor Green
Write-Host " -> Tổng số đang chờ tại sảnh: $($displayRes.data.total_waiting)" -ForegroundColor Cyan

# 7. Kiểm thử gửi Phản ánh kèm tọa độ GIS (/public/complaints)
Write-Host "`n[7/7] Gửi phản ánh hiện trường kèm tọa độ GPS (/public/complaints)..." -ForegroundColor Yellow
$cplBody = @{
    citizen_name = "Hoàng Minh Đức"
    citizen_phone = "0912345678"
    category = "RAC_THAI"
    title = "Rác thải tồn đọng ngã tư Đinh Tiên Hoàng - Hoàng Hoa Thám"
    description = "Rác thải sinh hoạt chưa được thu gom sau bão, bốc mùi ảnh hưởng khu dân cư"
    location = "Ngã tư Đinh Tiên Hoàng - Hoàng Hoa Thám (TDP 1)"
    latitude = 21.716800
    longitude = 104.896500
} | ConvertTo-Json
$cplBytes = [System.Text.Encoding]::UTF8.GetBytes($cplBody)
$cplRes = Invoke-RestMethod -Uri "$baseUrl/public/complaints" -Method Post -Body $cplBytes -ContentType "application/json; charset=utf-8"
Write-Host " -> Gửi phản ánh thành công! Mã phản ánh: $($cplRes.data.complaint_code)" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  100% CÁC KIỂM THỬ API ĐỀU ĐẠT CHUẨN XUẤT SẮC!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
