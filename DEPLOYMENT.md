# Mobius Backoffice App Deployment Guide

This guide covers deploying the Mobius Backoffice App to AWS S3 + CloudFront.

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. SSH key for EC2 access (if using EC2 as a deployment relay)
3. Node.js and npm installed

## AWS Resources Required

### Option 1: Create New Resources (Recommended)

#### 1. Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://mobius-backoffice-app --region us-east-1

# Configure for static website hosting
aws s3 website s3://mobius-backoffice-app --index-document index.html --error-document index.html

# Set bucket policy for public access (or use CloudFront OAI)
cat > bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::mobius-backoffice-app/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket mobius-backoffice-app --policy file://bucket-policy.json
```

#### 2. Create CloudFront Distribution

```bash
# Create distribution configuration
cat > cloudfront-config.json << 'EOF'
{
  "CallerReference": "mobius-backoffice-$(date +%s)",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-mobius-backoffice-app",
        "DomainName": "mobius-backoffice-app.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-mobius-backoffice-app",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": { "Forward": "none" }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "Comment": "Mobius Backoffice App",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  }
}
EOF

aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

**Note the Distribution ID and Domain Name from the output!**

### Option 2: Use Existing Infrastructure (via EC2)

If you want to reuse the existing EC2 instance as a deployment relay:

```bash
# The existing infrastructure details:
# S3 Bucket: traffic-app-development (web-app)
# CloudFront: E97YALKXH9Q7O (web-app)
# EC2: 35.173.216.15
```

You would need to create a new S3 bucket and CloudFront distribution for the backoffice app.

## Deployment Steps

### Step 1: Update Production Environment

Create `.env.production` with your production API URL:

```bash
REACT_APP_API_URL=https://your-api-domain.cloudfront.net
REACT_APP_JWT_TOKEN_NAME=backoffice_token
NODE_ENV=production
```

### Step 2: Build the Application

```bash
cd mobius-backoffice-app
npm run build
```

### Step 3: Deploy to S3

**Option A: Direct AWS CLI Deploy**

```bash
# Set your bucket name
BUCKET_NAME=mobius-backoffice-app

# Sync build folder to S3
aws s3 sync build/ s3://$BUCKET_NAME/ --delete

# Invalidate CloudFront cache (replace with your distribution ID)
CLOUDFRONT_ID=YOUR_DISTRIBUTION_ID
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"
```

**Option B: Via EC2 Relay (Windows Script Pattern)**

```bash
# Variables
EC2_HOST=ec2-user@35.173.216.15
KEY_PATH=/path/to/traffic-ec2-2.pem
BUCKET_NAME=mobius-backoffice-app
CLOUDFRONT_ID=YOUR_DISTRIBUTION_ID

# Create deployment package
tar -czf backoffice-deployment.tar.gz -C build .

# Transfer to EC2
scp -o StrictHostKeyChecking=no -i "$KEY_PATH" backoffice-deployment.tar.gz $EC2_HOST:~/

# Deploy from EC2
ssh -o StrictHostKeyChecking=no -i "$KEY_PATH" $EC2_HOST "
  rm -rf ~/backoffice-build && \
  mkdir -p ~/backoffice-build && \
  tar -xzf ~/backoffice-deployment.tar.gz -C ~/backoffice-build && \
  aws s3 sync ~/backoffice-build/ s3://$BUCKET_NAME/ --delete && \
  aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths '/*' && \
  rm ~/backoffice-deployment.tar.gz && \
  rm -rf ~/backoffice-build
"

# Cleanup local
rm backoffice-deployment.tar.gz
```

## Post-Deployment

1. **Verify Deployment**: Visit your CloudFront URL
2. **Wait for Propagation**: CloudFront may take 1-5 minutes to propagate changes
3. **Test Login**: Try logging in with an admin account

## Environment Variables Summary

| Variable | Development | Production |
|----------|------------|------------|
| `REACT_APP_API_URL` | `http://localhost:3001` | `https://your-api.cloudfront.net` |
| `REACT_APP_JWT_TOKEN_NAME` | `backoffice_token` | `backoffice_token` |
| `PORT` | `3002` | N/A (static hosting) |

## Troubleshooting

### "Access Denied" on Login
- Ensure the API CORS configuration includes the new CloudFront domain
- Check that the user has admin or superAdmin role

### White Screen / 404 Errors
- Verify CloudFront has the custom error response for 404 → /index.html
- Clear browser cache or wait for CloudFront propagation

### API Connection Issues
- Verify `REACT_APP_API_URL` in `.env.production` is correct
- Check browser console for CORS errors

## Security Notes

1. The backoffice uses a separate localStorage key (`backoffice_token`) from the main app
2. Only admin and superAdmin roles can access this portal
3. Ensure HTTPS is enforced via CloudFront

## Quick Reference Commands

```bash
# Build
npm run build

# Deploy (direct)
aws s3 sync build/ s3://mobius-backoffice-app/ --delete

# Invalidate cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"

# Check deployment status
curl -I https://your-cloudfront-domain.cloudfront.net
```
