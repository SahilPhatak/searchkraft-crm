# SearchKraft CRM — AWS Deployment Guide

## Architecture (5 users, minimum cost)

```
Users → CloudFront → S3 (index.html + assets)   ~$1–2/month
     → EC2 t3.micro (Node.js backend)            ~$8/month (or ~$0 Free Tier 1st year)
     → Supabase Pro (PostgreSQL)                  $25/month
                                     ─────────────────────
                                     Total: ~$34–35/month
```

---

## Step 1 — AWS Account Setup

1. Go to https://aws.amazon.com → Create account
2. In IAM → create a user `searchkraft-deploy` with these policies:
   - `AmazonEC2FullAccess`
   - `AmazonEC2ContainerRegistryFullAccess`
   - `AmazonS3FullAccess`
   - `CloudFrontFullAccess`
3. Create **Access Key** for that user → save `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

---

## Step 2 — ECR (Container Registry)

```bash
# Create the ECR repository
aws ecr create-repository \
  --repository-name searchkraft-crm-backend \
  --region ap-south-1

# Note the URI: <account-id>.dkr.ecr.ap-south-1.amazonaws.com/searchkraft-crm-backend
```

---

## Step 3 — EC2 Instance

1. **Launch EC2** → Mumbai region (`ap-south-1`) → t3.micro (Free Tier eligible first 12 months)
2. **AMI**: Amazon Linux 2023
3. **Security Group** — open these ports:
   - SSH: 22 (your IP only)
   - App: 10000 (from anywhere, or ALB only)
4. **Key pair** → download `.pem` file → keep it safe

### On the EC2 instance (SSH in first time):

```bash
# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install AWS CLI (for ECR login)
sudo yum install -y awscli

# Attach EC2 IAM role with ECR pull permission
# (In AWS Console → EC2 → instance → Actions → Security → Modify IAM role)
# Create role: EC2 → AmazonEC2ContainerRegistryReadOnly
```

**Get your EC2 public IP** → that's `EC2_HOST` in GitHub secrets.

**Get your SSH key content**:
```bash
cat ~/Downloads/your-key.pem
```
→ that's `EC2_SSH_KEY` in GitHub secrets (the full content including `-----BEGIN...-----END-----`)

---

## Step 4 — S3 Bucket

```bash
# Create bucket (replace with your preferred name)
aws s3 mb s3://searchkraft-crm-frontend --region ap-south-1

# Enable static website hosting
aws s3 website s3://searchkraft-crm-frontend \
  --index-document index.html \
  --error-document index.html

# Remove public block (CloudFront will handle access)
aws s3api put-public-access-block \
  --bucket searchkraft-crm-frontend \
  --public-access-block-configuration \
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Add bucket policy for public read
aws s3api put-bucket-policy \
  --bucket searchkraft-crm-frontend \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::searchkraft-crm-frontend/*"
    }]
  }'
```

---

## Step 5 — CloudFront Distribution

1. Go to **CloudFront → Create Distribution**
2. **Origin domain**: your S3 bucket website endpoint (NOT the S3 bucket itself)
   - Format: `searchkraft-crm-frontend.s3-website.ap-south-1.amazonaws.com`
3. **Viewer protocol policy**: Redirect HTTP to HTTPS
4. **Default root object**: `index.html`
5. **Custom error pages** → Add: 403 → `/index.html` (200), 404 → `/index.html` (200)
   - This makes React-style routing work
6. Create → note the **Distribution ID** and **CloudFront domain** (e.g. `d1abc.cloudfront.net`)

---

## Step 6 — GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret

| Secret Name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | From IAM user |
| `AWS_SECRET_ACCESS_KEY` | From IAM user |
| `AWS_REGION` | `ap-south-1` (Mumbai) |
| `AWS_ACCOUNT_ID` | Your 12-digit AWS account ID |
| `EC2_HOST` | EC2 public IP (e.g. `13.235.x.x`) |
| `EC2_SSH_KEY` | Full content of your `.pem` file |
| `S3_BUCKET_NAME` | `searchkraft-crm-frontend` |
| `CLOUDFRONT_DISTRIBUTION_ID` | From CloudFront (e.g. `E1ABC123`) |
| `DATABASE_URL` | Supabase connection string (from Supabase → Settings → Database) |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API |
| `JWT_SECRET` | Any random 32+ char string |
| `BACKEND_URL` | `http://<EC2-IP>:10000` |
| `FRONTEND_URL` | `https://<cloudfront-domain>.cloudfront.net` |

---

## Step 7 — Supabase Pro Upgrade

1. Supabase dashboard → your project → Settings → Billing
2. Upgrade to **Pro** ($25/month) — gives you:
   - Unlimited API requests
   - 8GB database (vs 500MB free)
   - Daily backups
   - No pausing after 1 week inactivity

---

## Step 8 — First Deploy

Push to `main` branch — GitHub Actions will automatically:
1. Run CI checks
2. Build Docker image → push to ECR
3. SSH into EC2 → pull latest image → restart container
4. Sync `public/` to S3 → invalidate CloudFront
5. Health check both URLs

Or trigger manually: GitHub → Actions → "CD — Deploy to Production (AWS)" → Run workflow

---

## Ongoing Costs Breakdown

| Service | Cost |
|---|---|
| EC2 t3.micro | $8.47/mo (Free for 1st year) |
| ECR (Docker images) | ~$0.10/mo |
| S3 (frontend files) | ~$0.01/mo |
| CloudFront | ~$0.50/mo (5 users, low traffic) |
| Supabase Pro | $25/mo |
| **Total** | **~$34/mo** (or ~$26/mo 1st year) |

---

## Useful Commands

```bash
# Check container is running on EC2
ssh -i your-key.pem ec2-user@<EC2-IP>
docker ps
docker logs searchkraft-crm --tail 50

# Manual deploy trigger
aws codedeploy ...  # or just push to main

# View CloudFront logs (optional — enable in distribution settings)
```
