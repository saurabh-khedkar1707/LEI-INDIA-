# Production Deployment Guide - LEI Indias

This guide covers deploying the LEI Indias application to AWS EC2 (Amazon Linux 2) with Nginx reverse proxy, PM2 process manager, and zero-downtime deployments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS EC2 Setup](#aws-ec2-setup)
3. [Server Configuration](#server-configuration)
4. [Application Setup](#application-setup)
5. [Nginx Configuration](#nginx-configuration)
6. [PM2 Setup](#pm2-setup)
7. [SSL/TLS Configuration](#ssltls-configuration)
8. [Deployment Process](#deployment-process)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

- AWS EC2 instance running Amazon Linux 2
- Domain name pointing to EC2 instance (for SSL)
- MongoDB database (local or MongoDB Atlas)
- SSH access to EC2 instance
- Basic knowledge of Linux command line

## AWS EC2 Setup

### 1. Launch EC2 Instance

1. Launch an EC2 instance (t3.medium or larger recommended)
2. Select Amazon Linux 2 AMI
3. Configure security group:
   - **Inbound Rules:**
     - SSH (22) from your IP
     - HTTP (80) from anywhere (0.0.0.0/0)
     - HTTPS (443) from anywhere (0.0.0.0/0)
   - **Outbound Rules:**
     - All traffic (for MongoDB, npm, etc.)

### 2. Connect to Instance

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### 3. Update System

```bash
sudo yum update -y
```

## Server Configuration

### 1. Install Node.js and pnpm

```bash
# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version  # Should be v20.x or higher
npm --version

# Install pnpm globally
sudo npm install -g pnpm@9.0.0

# Verify pnpm
pnpm --version
```

### 2. Install PM2

```bash
sudo npm install -g pm2

# Setup PM2 to start on system boot
pm2 startup systemd
# Follow the instructions provided by the command
```

### 3. Install Nginx

```bash
# Install Nginx
sudo amazon-linux-extras install nginx1 -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
```

### 4. Install MongoDB (if using local MongoDB)

```bash
# Create MongoDB repository file
sudo vi /etc/yum.repos.d/mongodb-org-7.0.repo

# Add the following content:
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc

# Install MongoDB
sudo yum install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Note:** For production, consider using MongoDB Atlas (cloud-hosted) instead of local MongoDB.

## Application Setup

### 1. Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www
sudo chown ec2-user:ec2-user /var/www
cd /var/www

# Clone your repository (update with your repo URL)
git clone https://github.com/your-org/leiindias.git
cd leiindias

# Or upload your code using SCP
# scp -r -i your-key.pem ./leiindias ec2-user@your-ec2-ip:/var/www/
```

### 2. Install Dependencies

```bash
cd /var/www/leiindias
pnpm install
```

### 3. Configure Environment Variables

#### Backend Environment Variables

```bash
cd /var/www/leiindias/backend
cp .env.example .env
vi .env  # or use nano
```

**Required variables:**
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-generate-with-openssl-rand-base64-32
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb://localhost:27017/leiindias
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/leiindias?retryWrites=true&w=majority
FRONTEND_URL=https://yourdomain.com
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=change-this-secure-password
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

#### Frontend Environment Variables

```bash
cd /var/www/leiindias/frontend
cp .env.example .env.local
vi .env.local  # or use nano
```

**Required variables:**
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

### 4. Build Applications

```bash
cd /var/www/leiindias
pnpm build:prod
```

### 5. Create Logs Directory

```bash
mkdir -p /var/www/leiindias/logs
```

## Nginx Configuration

### 1. Copy Nginx Configuration

```bash
# Copy the configuration file
sudo cp /var/www/leiindias/nginx/leiindias.conf /etc/nginx/sites-available/leiindias.conf

# Create symlink to enable the site
sudo ln -s /etc/nginx/sites-available/leiindias.conf /etc/nginx/sites-enabled/

# Remove default Nginx site (optional)
sudo rm /etc/nginx/sites-enabled/default
```

### 2. Update Configuration

```bash
sudo vi /etc/nginx/sites-available/leiindias.conf
```

**Update the following:**
- Replace `yourdomain.com` with your actual domain name
- Adjust rate limiting if needed
- Review and adjust upload size limits

### 3. Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

## PM2 Setup

### 1. Start Applications with PM2

```bash
cd /var/www/leiindias
pm2 start ecosystem.config.js --env production
```

### 2. Save PM2 Configuration

```bash
pm2 save
```

This ensures PM2 restarts applications on server reboot.

### 3. Verify Applications are Running

```bash
pm2 list
pm2 logs
pm2 monit  # Real-time monitoring
```

### 4. Check Health Endpoints

```bash
# Backend health check
curl http://localhost:3001/health

# Should return: {"status":"healthy","timestamp":"...","database":"connected"}
```

## SSL/TLS Configuration

### 1. Install Certbot

```bash
sudo yum install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Follow the prompts and enter your email address
```

### 3. Update Nginx Configuration for SSL

```bash
sudo vi /etc/nginx/sites-available/leiindias.conf
```

**Uncomment and update the HTTPS server block:**
- Update `ssl_certificate` paths
- Update `ssl_certificate_key` paths
- Update `server_name` with your domain
- Copy location blocks from HTTP to HTTPS block

### 4. Enable HTTP to HTTPS Redirect

Uncomment the HTTP server block that redirects to HTTPS.

### 5. Test and Reload

```bash
sudo nginx -t
sudo systemctl start nginx
sudo systemctl reload nginx
```

### 6. Setup Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a systemd timer for renewal
# Verify it's active:
sudo systemctl status certbot.timer
```

## Deployment Process

### 1. Zero-Downtime Deployment

```bash
cd /var/www/leiindias

# Pull latest changes
git pull origin main  # or your main branch

# Run deployment script
./scripts/deploy.sh

# Or manually:
# pnpm build:prod
# pm2 reload ecosystem.config.js --env production
```

### 2. Deployment Script Options

```bash
# Skip build (if you've already built)
./scripts/deploy.sh --skip-build

# Force deployment (skip some checks)
./scripts/deploy.sh --force
```

### 3. Verify Deployment

```bash
# Check PM2 status
pm2 list

# Check logs
pm2 logs

# Test health endpoint
curl https://yourdomain.com/api/health

# Test frontend
curl -I https://yourdomain.com
```

## Monitoring & Maintenance

### 1. PM2 Monitoring

```bash
# View all processes
pm2 list

# View logs
pm2 logs
pm2 logs leiindias-backend
pm2 logs leiindias-frontend

# Real-time monitoring
pm2 monit

# Process information
pm2 show leiindias-backend
pm2 show leiindias-frontend

# Restart applications
pm2 restart ecosystem.config.js

# Reload (zero-downtime)
pm2 reload ecosystem.config.js
```

### 2. Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/leiindias-access.log

# Error logs
sudo tail -f /var/log/nginx/leiindias-error.log
```

### 3. Application Logs

```bash
# PM2 logs (recommended)
pm2 logs

# Direct log files
tail -f /var/www/leiindias/logs/backend-combined.log
tail -f /var/www/leiindias/logs/frontend-combined.log
```

### 4. System Resources

```bash
# CPU and memory usage
htop  # Install with: sudo yum install htop

# Disk usage
df -h

# Process monitoring
pm2 monit
```

### 5. Database Maintenance

```bash
# MongoDB status (if local)
sudo systemctl status mongod

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Backup MongoDB (if local)
mongodump --out /backup/mongodb-$(date +%Y%m%d)
```

## Troubleshooting

### Application Won't Start

1. **Check PM2 logs:**
   ```bash
   pm2 logs
   ```

2. **Check environment variables:**
   ```bash
   cd /var/www/leiindias/backend
   cat .env  # Verify all required variables are set
   ```

3. **Check MongoDB connection:**
   ```bash
   curl http://localhost:3001/health
   ```

4. **Check port availability:**
   ```bash
   sudo lsof -i :3000
   sudo lsof -i :3001
   ```

### Nginx 502 Bad Gateway

1. **Check if applications are running:**
   ```bash
   pm2 list
   ```

2. **Check Nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/leiindias-error.log
   ```

3. **Test backend directly:**
   ```bash
   curl http://localhost:3001/health
   ```

4. **Check Nginx configuration:**
   ```bash
   sudo nginx -t
   ```

### High Memory Usage

1. **Check PM2 memory:**
   ```bash
   pm2 monit
   ```

2. **Restart applications:**
   ```bash
   pm2 restart ecosystem.config.js
   ```

3. **Adjust PM2 memory limit in ecosystem.config.js:**
   ```javascript
   max_memory_restart: '512M',  // Reduce if needed
   ```

### SSL Certificate Issues

1. **Check certificate expiration:**
   ```bash
   sudo certbot certificates
   ```

2. **Renew certificate manually:**
   ```bash
   sudo certbot renew
   ```

3. **Check Nginx SSL configuration:**
   ```bash
   sudo nginx -t
   ```

### CSRF Token Errors (Cluster Mode)

If you're using PM2 cluster mode and experiencing CSRF token validation failures, you need to implement Redis-based storage. See the comments in:
- `backend/src/middleware/csrf.ts`
- `backend/src/middleware/rate-limit.ts`

**Quick fix (not recommended for production):**
- Use single instance: Set `instances: 1` in ecosystem.config.js for backend

## Security Best Practices

1. **Firewall Configuration:**
   - Only expose ports 80, 443, and 22 (SSH)
   - Restrict SSH access to specific IPs

2. **Regular Updates:**
   ```bash
   sudo yum update -y
   ```

3. **Strong Passwords:**
   - Use strong JWT_SECRET (32+ characters)
   - Use strong MongoDB passwords
   - Change default admin credentials

4. **Environment Variables:**
   - Never commit `.env` files
   - Use secure storage for secrets (AWS Secrets Manager, etc.)

5. **MongoDB Security:**
   - Enable authentication
   - Use connection string with credentials
   - Restrict network access

6. **Nginx Security:**
   - Keep Nginx updated
   - Use strong SSL/TLS configuration
   - Enable security headers

## Backup Strategy

1. **Application Code:**
   - Use Git repository (already done)

2. **Database:**
   ```bash
   # Local MongoDB
   mongodump --out /backup/mongodb-$(date +%Y%m%d)
   
   # MongoDB Atlas (automatic backups available)
   ```

3. **Uploaded Files:**
   ```bash
   tar -czf /backup/uploads-$(date +%Y%m%d).tar.gz /var/www/leiindias/backend/uploads
   ```

4. **Environment Variables:**
   - Store securely (AWS Secrets Manager, etc.)
   - Document in secure location

## Scaling Considerations

1. **Horizontal Scaling:**
   - Use load balancer (AWS ALB)
   - Multiple EC2 instances
   - Shared Redis for CSRF/rate limiting
   - Shared MongoDB (Atlas recommended)

2. **Vertical Scaling:**
   - Upgrade EC2 instance type
   - Increase PM2 cluster instances

3. **Database Scaling:**
   - MongoDB Atlas with replica sets
   - Connection pooling (already configured)

## Support

For issues or questions:
1. Check application logs: `pm2 logs`
2. Check Nginx logs: `/var/log/nginx/`
3. Review this documentation
4. Check GitHub issues (if applicable)

---

**Last Updated:** 2024
**Maintained by:** DevOps Team
