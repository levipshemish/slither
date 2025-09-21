#!/bin/bash

echo "🐍 Slither.io Clone - Deployment Preparation"
echo "============================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    echo "node_modules/" > .gitignore
    echo ".env" >> .gitignore
    echo "*.log" >> .gitignore
    echo ".DS_Store" >> .gitignore
fi

# Add all files to git
echo "Adding files to git..."
git add .

# Create initial commit
echo "Creating initial commit..."
git commit -m "Initial commit: Slither.io clone ready for deployment"

echo ""
echo "✅ Repository prepared for deployment!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git remote add origin <your-repo-url> && git push -u origin main"
echo "2. Deploy backend to Railway: https://railway.app"
echo "3. Deploy frontend to Vercel: https://vercel.com"
echo "4. Update environment variables with your deployed URLs"
echo ""
echo "See DEPLOYMENT.md for detailed instructions!"