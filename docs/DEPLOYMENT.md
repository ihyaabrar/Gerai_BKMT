# Deployment Guide - Gerai BKMT

## Deployment Options

### 1. Vercel (Recommended) ⚡

Vercel adalah platform terbaik untuk Next.js apps.

#### Steps:

1. **Push ke GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/gerai-bkmt.git
git push -u origin main
```

2. **Deploy di Vercel**
- Buka [vercel.com](https://vercel.com)
- Sign in dengan GitHub
- Click "New Project"
- Import repository `gerai-bkmt`
- Configure:
  - Framework Preset: Next.js
  - Build Command: `npm run build`
  - Output Directory: `.next`
- Add Environment Variables:
  ```
  DATABASE_URL=file:./prod.db
  ```
- Click "Deploy"

3. **Setup Database**
```bash
# Setelah deploy, run di Vercel CLI atau dashboard
vercel env pull
npm run db:push
npm run db:seed
```

#### Notes:
- Vercel automatically handles SSL
- Auto-deploy on git push
- Free tier available
- Edge functions support

---

### 2. Railway 🚂

Railway bagus untuk full-stack apps dengan database.

#### Steps:

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login & Init**
```bash
railway login
railway init
```

3. **Add Database**
```bash
railway add
# Pilih PostgreSQL atau MySQL (untuk production)
```

4. **Deploy**
```bash
railway up
```

5. **Set Environment Variables**
```bash
railway variables set DATABASE_URL="your-database-url"
```

#### Notes:
- $5/month free credit
- Automatic SSL
- Database included
- Easy scaling

---

### 3. Netlify 🌐

#### Steps:

1. **Build Settings**
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

2. **Deploy**
- Connect GitHub repo
- Configure build settings
- Deploy

#### Notes:
- Free tier available
- Good for static sites
- May need serverless functions for API

---

### 4. VPS (DigitalOcean, AWS, etc.) 🖥️

Untuk kontrol penuh dan custom setup.

#### Requirements:
- Ubuntu 20.04+ or similar
- Node.js 18+
- Nginx
- PM2

#### Steps:

1. **Setup Server**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

2. **Clone & Setup App**
```bash
# Clone repository
git clone https://github.com/username/gerai-bkmt.git
cd gerai-bkmt

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env  # Edit DATABASE_URL

# Setup database
npm run db:push
npm run db:seed

# Build
npm run build
```

3. **Setup PM2**
```bash
# Start app
pm2 start npm --name "gerai-bkmt" -- start

# Save PM2 config
pm2 save

# Setup startup script
pm2 startup
```

4. **Configure Nginx**
```nginx
# /etc/nginx/sites-available/gerai-bkmt
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/gerai-bkmt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. **Setup SSL (Let's Encrypt)**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### Notes:
- Full control over server
- Can use any database
- Requires server management skills
- Monthly cost varies

---

### 5. Docker 🐳

Containerized deployment.

#### Dockerfile:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### docker-compose.yml:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:./prod.db
    volumes:
      - ./prisma:/app/prisma
    restart: unless-stopped
```

#### Deploy:
```bash
docker-compose up -d
```

---

## Database Considerations

### SQLite (Default)
- ✅ Simple setup
- ✅ No external database needed
- ✅ Good for small-medium scale
- ❌ Not ideal for high concurrency
- ❌ Backup requires file copy

### PostgreSQL (Recommended for Production)
- ✅ Better performance
- ✅ High concurrency support
- ✅ Better backup options
- ✅ Scalable

#### Migration to PostgreSQL:

1. **Update schema.prisma**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. **Update DATABASE_URL**
```
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

3. **Migrate**
```bash
npm run db:push
```

---

## Environment Variables

### Production .env:
```env
# Database
DATABASE_URL="your-production-database-url"

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id
```

---

## Performance Optimization

### 1. Enable Caching
```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['your-domain.com'],
  },
  compress: true,
  poweredByHeader: false,
};
```

### 2. Database Optimization
```typescript
// Add indexes in schema.prisma
model Barang {
  @@index([kode])
  @@index([barcode])
}
```

### 3. Enable Compression
```bash
# Nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

---

## Monitoring

### 1. Error Tracking (Sentry)
```bash
npm install @sentry/nextjs
```

### 2. Analytics (Google Analytics)
```bash
npm install @next/third-parties
```

### 3. Uptime Monitoring
- UptimeRobot
- Pingdom
- StatusCake

---

## Backup Strategy

### Automated Backup Script:
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_FILE="./prisma/prod.db"

# Create backup
cp $DB_FILE $BACKUP_DIR/backup_$DATE.db

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.db" -mtime +30 -delete

echo "Backup completed: backup_$DATE.db"
```

### Cron Job:
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

---

## Security Checklist

- [ ] Use HTTPS (SSL certificate)
- [ ] Set secure environment variables
- [ ] Enable CORS properly
- [ ] Use strong passwords
- [ ] Regular security updates
- [ ] Database backups
- [ ] Rate limiting
- [ ] Input validation
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection

---

## Troubleshooting

### Build Errors
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Database Issues
```bash
# Reset database
npm run db:push -- --force-reset
npm run db:seed
```

### Port Already in Use
```bash
# Find process
lsof -i :3000
# Kill process
kill -9 <PID>
```

---

## Support

Jika ada masalah deployment:
1. Check logs
2. Verify environment variables
3. Test locally first
4. Check documentation
5. Open GitHub issue

---

## Cost Estimation

### Free Tier Options:
- Vercel: Free (hobby projects)
- Netlify: Free (100GB bandwidth)
- Railway: $5/month credit

### Paid Options:
- VPS (DigitalOcean): $5-10/month
- AWS/GCP: Pay as you go
- Dedicated Server: $20+/month

---

## Recommended Setup

For small business:
- **Hosting**: Vercel or Railway
- **Database**: PostgreSQL (Railway/Supabase)
- **Monitoring**: Sentry (free tier)
- **Backup**: Automated daily backups

Total cost: ~$5-15/month
