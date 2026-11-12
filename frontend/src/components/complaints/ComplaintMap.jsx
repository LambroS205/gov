import React, { useEffect, useRef, useState } from 'react';
import { Card, Tag, Button, Spin, Typography, Space, Row, Col, Badge } from 'antd';
import {
  CompassOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

export default function ComplaintMap({ complaints = [], onSelectComplaint }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);

  // Vị trí trung tâm Phường Yên Bái, TP Yên Bái
  const CENTER_LAT = 21.7168;
  const CENTER_LNG = 104.8965;

  useEffect(() => {
    // 1. Kiểm tra và tải Leaflet CSS & JS nếu chưa có
    const loadLeaflet = async () => {
      if (!window.L) {
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        if (!document.getElementById('leaflet-js')) {
          const script = document.createElement('script');
          script.id = 'leaflet-js';
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => initMap();
          script.onerror = () => setMapLoaded(true); // Fallback sang SVG map
          document.body.appendChild(script);
        }
      } else {
        initMap();
      }
    };

    const initMap = () => {
      if (!mapContainerRef.current || !window.L) return;

      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        const map = window.L.map(mapContainerRef.current).setView([CENTER_LAT, CENTER_LNG], 15);
        mapInstanceRef.current = map;

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors | YenBai eWard-Gov GIS',
        }).addTo(map);

        // Marker cho UBND Phường Yên Bái
        const govIcon = window.L.divIcon({
          className: 'gov-marker',
          html: `<div style="background:#b91c1c;color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #f59e0b;box-shadow:0 3px 10px rgba(0,0,0,0.3)">⭐</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
        window.L.marker([CENTER_LAT, CENTER_LNG], { icon: govIcon })
          .addTo(map)
          .bindPopup('<strong>TRỤ SỞ UBND PHƯỜNG YÊN BÁI</strong><br>Trung tâm chỉ đạo điều hành');

        // Vẽ các điểm phản ánh
        complaints.forEach((c) => {
          const lat = parseFloat(c.latitude) || (CENTER_LAT + (Math.random() - 0.5) * 0.008);
          const lng = parseFloat(c.longitude) || (CENTER_LNG + (Math.random() - 0.5) * 0.008);

          const color = c.status === 'MOI' ? '#dc2626' : c.status === 'DANG_XU_LY' ? '#d97706' : '#15803d';
          const iconSymbol = c.status === 'MOI' ? '🚨' : c.status === 'DANG_XU_LY' ? '⏳' : '✓';

          const pinIcon = window.L.divIcon({
            className: 'complaint-pin',
            html: `<div style="background:${color};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;border:2px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,0.35);font-weight:bold">${iconSymbol}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = window.L.marker([lat, lng], { icon: pinIcon }).addTo(map);

          const popupContent = document.createElement('div');
          popupContent.style.minWidth = '200px';
          popupContent.innerHTML = `
            <div style="font-weight:800;color:${color};font-size:12px;margin-bottom:2px">[${c.complaint_code}]</div>
            <div style="font-weight:700;color:#0f172a;font-size:13px;line-height:1.3">${c.title}</div>
            <div style="font-size:11px;color:#64748b;margin:4px 0">📍 ${c.location || 'Địa bàn Phường Yên Bái'}</div>
            <div style="margin-top:6px">
              <span style="display:inline-block;padding:2px 6px;border-radius:4px;background:${color}22;color:${color};font-size:10px;font-weight:700">${c.status === 'MOI' ? 'Tin mới' : c.status === 'DANG_XU_LY' ? 'Đang xử lý' : 'Đã xử lý'}</span>
            </div>
          `;

          const btn = document.createElement('button');
          btn.innerText = 'Xem chi tiết & Điều phối →';
          btn.style.cssText = `margin-top:8px;width:100%;background:#b91c1c;color:#fff;border:none;border-radius:4px;padding:5px 8px;font-size:11px;font-weight:bold;cursor:pointer`;
          btn.onclick = () => {
            if (onSelectComplaint) onSelectComplaint(c);
          };
          popupContent.appendChild(btn);

          marker.bindPopup(popupContent);
        });

        setMapLoaded(true);
      } catch (err) {
        console.warn('Lỗi khởi tạo Leaflet map:', err);
        setMapLoaded(true);
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [complaints]);

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 14, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
      {/* THANH CHÚ THÍCH TRÊN BẢN ĐỒ */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          padding: '8px 14px',
          borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          border: '1px solid #e2e8f0',
          fontSize: 12,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 4, color: '#1e293b' }}>
          🗺️ BẢN ĐỒ HIỆN TRƯỜNG PHƯỜNG YÊN BÁI
        </div>
        <Space size={12} wrap>
          <span><span style={{ color: '#dc2626', fontWeight: 800 }}>●</span> Mới ({complaints.filter(c => c.status === 'MOI').length})</span>
          <span><span style={{ color: '#d97706', fontWeight: 800 }}>●</span> Đang xử lý ({complaints.filter(c => c.status === 'DANG_XU_LY').length})</span>
          <span><span style={{ color: '#15803d', fontWeight: 800 }}>●</span> Đã xong ({complaints.filter(c => c.status === 'DA_XU_LY').length})</span>
        </Space>
      </div>

      {/* CONTAINER BẢN ĐỒ CHÍNH */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: 520,
          background: '#e2e8f0',
        }}
      />
    </div>
  );
}

