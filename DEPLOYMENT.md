# 🚀 Loveli Deployment Guide

This guide covers deploying Loveli to Vercel with GitHub CI/CD integration.

## 📋 Prerequisites

- GitHub repository with your Loveli code
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Node.js 18+ installed locally
- Environment variables configured

## 🔑 Required GitHub Secrets

Add these secrets in your GitHub repository:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add the following repository secrets:

### **VERCEL_TOKEN**
- Get from [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
- Create a new token with full scope

### **VERCEL_ORG_ID**
- Get from [Vercel Dashboard → Settings → General](https://vercel.com/account)
- Copy the "Team ID" or "Personal Account ID"

### **VERCEL_PROJECT_ID**
- Get after creating your Vercel project
- Found in project settings or `.vercel/project.json`

## 🚀 Vercel Deployment Setup

### **Step 1: Connect GitHub to Vercel**

1. **Sign in to Vercel** with your GitHub account
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure project settings:**
   - Framework Preset: Next.js
   - Root Directory: `./` (or leave default)
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### **Step 2: Configure Environment Variables**

In your Vercel project dashboard:

1. Go to **Settings → Environment Variables**
2. Add all variables from your `.env.local` file:

```env
DATABASE_URL=your_production_database_url
REDIS_URL=your_production_redis_url
OPENAI_API_KEY=your_openai_api_key
HUGGINGFACE_TOKEN=your_huggingface_token
TURN_SERVER_URL=your_turn_server_url
TURN_SERVER_USERNAME=your_turn_username
TURN_SERVER_CREDENTIAL=your_turn_credential
SESSION_SECRET=your_session_secret
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret
WS_PORT=3001
NEXT_PUBLIC_WS_URL=https://your-domain.vercel.app
```

### **Step 3: Configure Build Settings**

In **Settings → General**:

- **Node.js Version**: 18.x
- **Install Command**: `npm install`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Development Command**: `npm run dev`

## 🔄 CI/CD Pipeline

### **Automatic Deployments**

- **Push to `main` branch**: Triggers production deployment
- **Pull Request**: Creates preview deployment
- **Push to `develop` branch**: Creates staging deployment

### **Manual Deployments**

```bash
# Deploy to production
npm run deploy:vercel

# Deploy with Docker
npm run deploy:docker

# Deploy to specific environment
./scripts/deploy.sh vercel
./scripts/deploy.sh docker
./scripts/deploy.sh production
```

## 🐳 Docker Deployment Alternative

### **Local Development with Docker**

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### **Production Docker Deployment**

```bash
# Build and deploy
./scripts/deploy.sh docker

# Or manually
docker build -t loveli:production .
docker run -d -p 3000:3000 --name loveli-app loveli:production
```

## 🌐 Custom Domain Setup

### **Step 1: Add Domain in Vercel**

1. Go to **Settings → Domains**
2. Add your custom domain
3. Vercel will provide DNS records

### **Step 2: Configure DNS**

Add these records to your domain registrar:

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.19.36
```

### **Step 3: Update Environment Variables**

```env
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_WS_URL=https://your-domain.com
```

## 📊 Monitoring & Analytics

### **Vercel Analytics**

- **Speed Insights**: Monitor Core Web Vitals
- **Web Analytics**: Track page views and user behavior
- **Real User Monitoring**: Performance metrics

### **Build Monitoring**

- **Build Logs**: View in Vercel dashboard
- **Deployment History**: Track all deployments
- **Performance**: Monitor build times and success rates

## 🔧 Troubleshooting

### **Common Issues**

1. **Build Failures**
   - Check build logs in Vercel dashboard
   - Verify environment variables are set
   - Ensure all dependencies are in `package.json`

2. **Environment Variables**
   - Verify all required variables are set
   - Check variable names match exactly
   - Ensure no extra spaces or quotes

3. **Database Connection**
   - Verify `DATABASE_URL` is correct
   - Check database is accessible from Vercel
   - Ensure SSL is configured if required

### **Debug Commands**

```bash
# Check build locally
npm run build

# Test production build
npm start

# Check environment variables
npm run env:check

# Validate configuration
npm run validate
```

## 📈 Performance Optimization

### **Build Optimization**

- **Standalone Output**: Already configured in `next.config.js`
- **Image Optimization**: Using `next/image` component
- **Code Splitting**: Automatic with Next.js
- **Bundle Analysis**: Use `@next/bundle-analyzer`

### **Runtime Optimization**

- **Edge Functions**: API routes run at edge
- **CDN**: Global content delivery
- **Caching**: Automatic static asset caching
- **Compression**: Gzip/Brotli compression

## 🔒 Security Considerations

### **Environment Variables**

- Never commit `.env` files to Git
- Use Vercel's encrypted environment variables
- Rotate secrets regularly
- Use least privilege principle

### **API Security**

- Rate limiting on API routes
- Input validation and sanitization
- CORS configuration
- Authentication and authorization

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)

## 🆘 Support

If you encounter issues:

1. Check Vercel build logs
2. Review GitHub Actions workflow
3. Verify environment variables
4. Check database connectivity
5. Review application logs

---

**Happy Deploying! 🚀✨**
