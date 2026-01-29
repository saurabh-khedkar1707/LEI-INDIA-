# Deployment Guide

This document provides detailed instructions for deploying LEI Indias to various platforms.

## Table of Contents

- [Netlify Deployment](#netlify-deployment)
- [AWS Deployment](#aws-deployment)
  - [AWS ECS (Docker)](#aws-ecs-docker)
  - [AWS Elastic Beanstalk](#aws-elastic-beanstalk)
  - [AWS EC2](#aws-ec2)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Troubleshooting](#troubleshooting)

## Netlify Deployment

### Prerequisites

- Netlify account
- GitHub repository connected
- Environment variables configured

### Steps

1. **Connect Repository**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Select your GitHub repository
   - Authorize Netlify to access your repository

2. **Configure Build Settings**
   - Build command: `pnpm build`
   - Publish directory: `.next`
   - Node version: `20.x`

3. **Set Environment Variables**
   Navigate to Site settings → Environment variables and add:
   ```
   DATABASE_URL=your-postgresql-connection-string
   JWT_SECRET=your-secret-key-min-32-chars
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
   NEXT_PUBLIC_API_URL=https://your-site.netlify.app
   ```

4. **Deploy**
   - Netlify will automatically deploy on every push to the main branch
   - Or trigger a manual deploy from the dashboard

### Netlify Functions

The application uses Next.js serverless functions which are automatically handled by Netlify's Next.js plugin.

## AWS Deployment

### AWS ECS (Docker) - Recommended

#### Prerequisites

- AWS CLI configured
- Docker installed
- ECR repository created
- ECS cluster and service configured
- RDS PostgreSQL database (or external database)

#### Steps

1. **Create ECR Repository**
   ```bash
   aws ecr create-repository --repository-name leiindias --region us-east-1
   ```

2. **Build and Push Docker Image**
   ```bash
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
   
   # Build image
   docker build -t leiindias:latest .
   
   # Tag and push
   docker tag leiindias:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/leiindias:latest
   docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/leiindias:latest
   ```

3. **Set Up ECS Cluster**
   ```bash
   aws ecs create-cluster --cluster-name leiindias-cluster
   ```

4. **Create Task Definition**
   - Use the provided `aws/task-definition.json` as a template
   - Update the image URI and secrets ARNs
   - Register the task definition:
   ```bash
   aws ecs register-task-definition --cli-input-json file://aws/task-definition.json
   ```

5. **Create ECS Service**
   ```bash
   aws ecs create-service \
     --cluster leiindias-cluster \
     --service-name leiindias-service \
     --task-definition leiindias-task \
     --desired-count 2 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
   ```

6. **Store Secrets in AWS Secrets Manager**
   ```bash
   aws secretsmanager create-secret --name leiindias/DATABASE_URL --secret-string "postgresql://..."
   aws secretsmanager create-secret --name leiindias/JWT_SECRET --secret-string "your-secret-key"
   ```

7. **Deploy Using Script**
   ```bash
   ./aws/deploy.sh
   ```

#### Using GitHub Actions

The `.github/workflows/deploy-aws.yml` workflow automatically builds and deploys to ECS on push to main branch.

**Required GitHub Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (optional, defaults to us-east-1)

### AWS Elastic Beanstalk

#### Prerequisites

- AWS CLI configured
- EB CLI installed: `pip install awsebcli`

#### Steps

1. **Initialize Elastic Beanstalk**
   ```bash
   eb init -p "Node.js" leiindias
   ```

2. **Create Environment**
   ```bash
   eb create leiindias-prod
   ```

3. **Set Environment Variables**
   ```bash
   eb setenv DATABASE_URL=your-db-url \
            JWT_SECRET=your-secret \
            NODE_ENV=production \
            NEXT_PUBLIC_APP_URL=https://your-app.elasticbeanstalk.com
   ```

4. **Deploy**
   ```bash
   eb deploy
   ```

5. **Check Status**
   ```bash
   eb status
   eb logs
   ```

### AWS EC2

#### Prerequisites

- EC2 instance running (Amazon Linux 2 or Ubuntu)
- Security group allowing HTTP (80), HTTPS (443), and SSH (22)
- Domain name (optional, for SSL)

#### Steps

1. **Connect to EC2 Instance**
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   ```

2. **Install Dependencies**
   ```bash
   # Install Node.js 20
   curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
   sudo yum install -y nodejs
   
   # Install pnpm
   npm install -g pnpm@9.0.0
   
   # Install PostgreSQL client (if needed)
   sudo yum install -y postgresql
   ```

3. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/leiindias.git
   cd leiindias
   ```

4. **Set Environment Variables**
   ```bash
   # Create .env file
   nano .env
   # Add all required environment variables
   ```

5. **Build and Start**
   ```bash
   pnpm install
   pnpm build
   ```

6. **Install PM2 for Process Management**
   ```bash
   npm install -g pm2
   pm2 start pnpm --name "leiindias" -- start:prod
   pm2 save
   pm2 startup  # Follow instructions to enable startup on boot
   ```

7. **Set Up Nginx (Reverse Proxy)**
   ```bash
   sudo yum install -y nginx
   ```

   Create `/etc/nginx/conf.d/leiindias.conf`:
   ```nginx
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
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

8. **Set Up SSL with Let's Encrypt (Optional)**
   ```bash
   sudo yum install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | `your-super-secret-key-here` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `NODE_ENV` | Environment mode | `development` |
| `NEXT_PUBLIC_APP_URL` | Public application URL | - |
| `NEXT_PUBLIC_API_URL` | Public API URL | - |
| `LOG_LEVEL` | Logging level | `info` |
| `SENTRY_DSN` | Sentry error tracking DSN | - |
| `SENTRY_ENVIRONMENT` | Sentry environment name | - |

## Database Setup

### PostgreSQL Requirements

- PostgreSQL 12.x or higher
- Database created
- User with appropriate permissions

### Initialize Database

1. **Connect to Database**
   ```bash
   psql -U your_user -d leiindias
   ```

2. **Run Schema**
   ```sql
   \i prisma/schema.sql
   ```

3. **Grant Permissions (if needed)**
   ```sql
   \i prisma/grant-permissions.sql
   ```

4. **Initialize Data (optional)**
   ```bash
   pnpm tsx src/initDatabase.ts
   ```

## Troubleshooting

### Build Failures

- **Error: Missing environment variables**
  - Ensure all required environment variables are set
  - Check `.env` file or platform environment variable settings

- **Error: Database connection failed**
  - Verify `DATABASE_URL` is correct
  - Check database is accessible from deployment environment
  - Verify firewall/security group rules

### Runtime Issues

- **Application crashes on startup**
  - Check logs: `pm2 logs` (EC2) or CloudWatch logs (AWS)
  - Verify all environment variables are set
  - Check database connectivity

- **API routes not working**
  - Verify `NEXT_PUBLIC_API_URL` is set correctly
  - Check CORS settings if accessing from different domain
  - Verify reverse proxy configuration (if using Nginx)

### Performance Issues

- **Slow page loads**
  - Enable caching in Next.js
  - Use CDN for static assets
  - Optimize database queries
  - Consider using Redis for caching

### Deployment-Specific Issues

#### Netlify

- **Build timeout**
  - Increase build timeout in Netlify settings
  - Optimize build process

- **Function errors**
  - Check function logs in Netlify dashboard
  - Verify environment variables are set

#### AWS ECS

- **Task fails to start**
  - Check CloudWatch logs
  - Verify task definition and secrets
  - Check security group rules

- **Service not updating**
  - Force new deployment: `aws ecs update-service --force-new-deployment`

#### AWS Elastic Beanstalk

- **Deployment fails**
  - Check logs: `eb logs`
  - Verify `.ebextensions` configuration
  - Check environment health: `eb health`

## Monitoring

### Recommended Tools

- **Application Monitoring**: Sentry (error tracking)
- **Infrastructure Monitoring**: CloudWatch (AWS), Netlify Analytics
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Performance Monitoring**: New Relic, Datadog

### Health Check Endpoint

The application provides a health check endpoint at `/api/health` that can be used for monitoring.

## Backup and Recovery

### Database Backups

- **Automated Backups**: Use AWS RDS automated backups or similar
- **Manual Backups**: `pg_dump -U user -d leiindias > backup.sql`
- **Restore**: `psql -U user -d leiindias < backup.sql`

### Application Backups

- **Code**: Git repository (GitHub)
- **Uploads**: Backup `public/uploads` directory regularly
- **Configuration**: Store environment variables securely (AWS Secrets Manager, etc.)

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment variables** for all sensitive data
3. **Enable HTTPS** for all deployments
4. **Keep dependencies updated**: `pnpm audit` regularly
5. **Use strong JWT secrets** (minimum 32 characters)
6. **Implement rate limiting** (already included)
7. **Regular security audits**: `pnpm audit`
8. **Use AWS Secrets Manager** or similar for production secrets

## Support

For deployment issues, please:
1. Check this documentation
2. Review application logs
3. Check platform-specific documentation
4. Create an issue in the GitHub repository
