import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function autoDeployToRoot() {
  return {
    name: 'auto-deploy-to-root',
    closeBundle() {
      try {
        const distDir = path.resolve(__dirname, 'dist');
        const rootDir = path.resolve(__dirname, '..');
        const distAssetsDir = path.join(distDir, 'assets');
        const rootAssetsDir = path.join(rootDir, 'assets');
        const distIndexHtml = path.join(distDir, 'index.html');
        const rootIndexHtml = path.join(rootDir, 'index.html');

        if (!fs.existsSync(distDir)) return;

        // 1. Dọn dẹp các tệp hash .js, .css cũ trong assets/ gốc
        if (!fs.existsSync(rootAssetsDir)) {
          fs.mkdirSync(rootAssetsDir, { recursive: true });
        } else {
          const oldFiles = fs.readdirSync(rootAssetsDir);
          for (const file of oldFiles) {
            if (/\.(js|css|map)$/.test(file)) {
              fs.unlinkSync(path.join(rootAssetsDir, file));
            }
          }
        }

        // 2. Chuyển các assets mới từ dist/assets/ sang assets/ gốc
        if (fs.existsSync(distAssetsDir)) {
          const newFiles = fs.readdirSync(distAssetsDir);
          for (const file of newFiles) {
            fs.copyFileSync(path.join(distAssetsDir, file), path.join(rootAssetsDir, file));
          }
        }

        // 3. Cập nhật file index.html gốc
        if (fs.existsSync(distIndexHtml)) {
          fs.copyFileSync(distIndexHtml, rootIndexHtml);
        }

        // 4. Xóa thư mục dist/ sau khi deploy để giữ repo tinh gọn
        fs.rmSync(distDir, { recursive: true, force: true });
        console.log('✅ Auto-deployed build to root (assets/ & index.html) and cleaned dist/');
      } catch (err) {
        console.error('Lỗi khi tự động deploy build sang root:', err);
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '/gov/',
  plugins: [react(), autoDeployToRoot()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
              return 'vendor-charts';
            }
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost/gov',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost/gov',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
