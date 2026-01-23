#!/bin/bash

# App Store Submission Script for Nigerian Apartments
# This script automates the build and submission process

echo "=========================================="
echo "  NIGERIAN APARTMENTS - APP STORE SUBMISSION"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${RED}❌ EAS CLI is not installed${NC}"
    echo "Install it with: npm install -g eas-cli"
    exit 1
fi

echo -e "${GREEN}✅ EAS CLI found${NC}"
echo ""

# Step 1: Check login status
echo "Step 1: Checking EAS login status..."
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in. Please login:${NC}"
    eas login
else
    echo -e "${GREEN}✅ Already logged in${NC}"
    eas whoami
fi
echo ""

# Step 2: Verify credentials
echo "Step 2: Verifying iOS credentials..."
read -p "Do you want to check/update credentials? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    eas credentials
fi
echo ""

# Step 3: Build production app
echo "Step 3: Building production app..."
echo -e "${YELLOW}This will take 15-30 minutes...${NC}"
read -p "Continue with build? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting build..."
    eas build --platform ios --profile production
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Build started successfully${NC}"
        echo "Monitor progress with: eas build:list"
        echo ""
        
        # Step 4: Submit to App Store
        read -p "Build started. Submit to App Store when build completes? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            echo "Waiting for build to complete..."
            echo "You'll receive an email when the build is ready."
            echo ""
            read -p "Press Enter when build is complete to submit..."
            
            echo "Submitting to App Store..."
            eas submit --platform ios --latest
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Submission successful!${NC}"
                echo "Check App Store Connect for processing status."
            else
                echo -e "${RED}❌ Submission failed${NC}"
                echo "Check the error message above."
            fi
        fi
    else
        echo -e "${RED}❌ Build failed${NC}"
        echo "Check the error message above."
        exit 1
    fi
else
    echo "Build cancelled."
    exit 0
fi

echo ""
echo "=========================================="
echo "  SUBMISSION PROCESS COMPLETE"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Go to App Store Connect"
echo "2. Complete app listing (screenshots, description)"
echo "3. Submit for review"
echo ""
echo "See APP_STORE_SUBMISSION_GUIDE.md for details."


