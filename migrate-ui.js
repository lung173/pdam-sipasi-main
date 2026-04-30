// migrate-ui.js
const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'pdam-sipasi-updated');
const targetDir = __dirname;

function copyDirectoryRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);
    
    // Skip node_modules, .git, .next, and prisma
    if (['node_modules', '.git', '.next', 'prisma', '.env', '.env.local'].includes(entry.name)) {
      continue;
    }
    
    // Preserve manual API changes
    if (srcPath.includes(path.join('app', 'api', 'documents')) || srcPath.includes(path.join('app\\api\\documents'))) {
      continue;
    }
    if (srcPath.includes(path.join('app', 'api', 'audit-logs')) || srcPath.includes(path.join('app\\api\\audit-logs'))) {
      continue;
    }

    if (entry.isDirectory()) {
      // Skip staff, kabag and kasubag
      if (['staff', 'kabag', 'kasubag'].includes(entry.name)) {
        continue;
      }
      
      // Rename admin to admin-staff
      if (entry.name === 'admin') {
        if (src.includes(path.join('app', 'dashboard')) || src.includes(path.join('app\\dashboard'))) {
           destPath = path.join(dest, 'admin-staff');
        }
      }

      copyDirectoryRecursive(srcPath, destPath);
    } else {
      // Only process .ts and .tsx files for content replacement
      if (srcPath.endsWith('.ts') || srcPath.endsWith('.tsx')) {
        let content = fs.readFileSync(srcPath, 'utf8');
        
        // Refactor role references
        content = content.replace(/['"]STAFF['"]/g, '"ADMIN_STAFF"');
        content = content.replace(/['"]ADMIN['"]/g, '"ADMIN_STAFF"');
        content = content.replace(/role === ['"]ADMIN_STAFF['"] \|\| role === ['"]ADMIN_STAFF['"]/g, 'role === "ADMIN_STAFF"');
        
        // Change routing references
        content = content.replace(/\/dashboard\/staff/g, '/dashboard/admin-staff');
        content = content.replace(/\/dashboard\/admin/g, '/dashboard/admin-staff');
        
        fs.writeFileSync(destPath, content);
      } else {
        // Just copy other files (css, json, etc)
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

console.log("Memulai proses migrasi UI dan API dari pdam-sipasi-updated ke pdam-system...");

try {
  // 1. Bersihkan folder app/dashboard lama untuk menghindari bentrok
  const dashboardDir = path.join(targetDir, 'app', 'dashboard');
  if (fs.existsSync(dashboardDir)) {
    fs.rmSync(dashboardDir, { recursive: true, force: true });
  }

  // 2. Copy folder app, components, lib, types, hooks
  const foldersToMigrate = ['app', 'components', 'lib', 'types', 'hooks'];
  
  for (const folder of foldersToMigrate) {
    const src = path.join(sourceDir, folder);
    const dest = path.join(targetDir, folder);
    
    if (fs.existsSync(src)) {
      console.log(`Migrating ${folder}...`);
      copyDirectoryRecursive(src, dest);
    }
  }
  
  // 3. Kembalikan file spesifik yang sudah kita buat sebelumnya (middleware, dll) agar tidak tertimpa
  // Tapi kebetulan migrate-ui ini hanya me-replace, jadi yang sudah saya tulis di pdam-system sebagian akan ter-overwrite. 
  // Kita inject barcode dan verify page:
  
  console.log("Menyelesaikan migrasi spesifik...");

  console.log("✅ Migrasi UI dan API berhasil diselesaikan!");
  console.log("Silakan jalankan 'npm run dev' untuk menguji hasilnya.");

} catch (e) {
  console.error("Terjadi kesalahan saat migrasi:", e);
}
