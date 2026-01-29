# GitHub Setup Guide

This guide will help you connect your repository to GitHub and set up automated deployments.

## Initial GitHub Setup

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon → "New repository"
3. Name it `leiindias` (or your preferred name)
4. Choose visibility (public/private)
5. **Do NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### 2. Connect Local Repository to GitHub

```bash
# If you haven't initialized git yet
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit: LEI Indias platform"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/leiindias.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Set Up GitHub Secrets

For CI/CD workflows to work, you need to set up secrets in GitHub:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

#### Required Secrets for CI/CD:

- `DATABASE_URL` - Your PostgreSQL connection string (for build testing)
- `JWT_SECRET` - Your JWT secret key (for build testing)

#### Required Secrets for Netlify Deployment:

- `NETLIFY_AUTH_TOKEN` - Get from [Netlify User Settings → Applications → New access token](https://app.netlify.com/user/applications)
- `NETLIFY_SITE_ID` - Found in Netlify site settings → General → Site details

#### Required Secrets for AWS Deployment:

- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- Optionally: `AWS_REGION` (defaults to us-east-1)

### 4. Enable GitHub Actions

GitHub Actions are enabled by default. The workflows will run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual trigger via workflow_dispatch

## Workflow Overview

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and PR:
- ✅ Lints code
- ✅ Builds application
- ✅ Security audit
- ✅ Checks for console logs

### Netlify Deployment (`.github/workflows/deploy-netlify.yml`)

Runs on push to `main`:
- Builds application
- Deploys to Netlify

**To enable**: Add `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` secrets

### AWS Deployment (`.github/workflows/deploy-aws.yml`)

Runs on push to `main`:
- Builds Docker image
- Pushes to ECR
- Deploys to ECS

**To enable**: 
1. Set up AWS ECS infrastructure first
2. Add AWS secrets
3. Update `aws/task-definition.json` with your ECR repository URI

### Docker Build (`.github/workflows/docker-build.yml`)

Runs on push and tags:
- Builds Docker image
- Tests image

### Release (`.github/workflows/release.yml`)

Runs on version tags (v*.*.*):
- Creates GitHub release
- Builds application

## Branch Protection (Recommended)

To protect your main branch:

1. Go to **Settings** → **Branches**
2. Add rule for `main` branch:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - Select required checks: `lint`, `build`

## Next Steps

1. **Set up Netlify** (see [DEPLOYMENT.md](./DEPLOYMENT.md))
2. **Set up AWS** (see [DEPLOYMENT.md](./DEPLOYMENT.md))
3. **Configure environment variables** in your deployment platforms
4. **Test the workflows** by making a small change and pushing

## Troubleshooting

### Workflows Not Running

- Check that workflows are in `.github/workflows/` directory
- Verify YAML syntax is correct
- Check GitHub Actions tab for error messages

### Build Failures

- Verify all required secrets are set
- Check that environment variables are correct
- Review workflow logs for specific errors

### Deployment Failures

- Verify platform credentials (Netlify token, AWS keys)
- Check platform-specific logs
- Ensure infrastructure is set up correctly

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Netlify Documentation](https://docs.netlify.com/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment instructions
