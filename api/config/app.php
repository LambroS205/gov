<?php
// Cấu hình chung của ứng dụng YenBai eWard-Gov
return [
    'app_name' => 'Hệ thống Một cửa điện tử và Quản trị Hành chính Số UBND Phường Yên Bái',
    'app_short_name' => 'YenBai eWard-Gov',
    'version' => '1.0.0',
    'jwt_secret' => 'YenBai-eGov-Secret-Key-2026-SuperSecure-Salt-998877',
    'jwt_expiry' => 86400, // 24 giờ
    'upload_dir' => dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'uploads',
    'max_file_size' => 10 * 1024 * 1024, // 10MB
    'allowed_extensions' => ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'zip']
];
