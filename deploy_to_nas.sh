#!/bin/bash

# Ugreen NAS Deployment Script 🚀
NAS_IP="192.168.100.2"
NAS_USER="kwamenero"

echo "======================================================="
echo "              NAS Deployment Tool 🛠️                  "
echo "======================================================="
echo "Before deploying, make sure you have:"
echo "1. Committed and pushed your code to GitHub."
echo "2. Waited ~4 minutes for GitHub Actions to build it."
echo "-------------------------------------------------------"
read -p "Press ENTER to deploy to the NAS (or CTRL+C to cancel)... " dummy

echo ""
echo "📥 1/3: Pulling the latest Backend Image on NAS..."
ssh $NAS_USER@$NAS_IP "docker pull ghcr.io/eugeneadu/yesmarttutor-backend:latest"

echo ""
echo "📥 2/3: Pulling the latest Frontend Image on NAS..."
ssh $NAS_USER@$NAS_IP "docker pull ghcr.io/eugeneadu/yesmarttutor-frontend:latest"

echo ""
echo "🔄 3/3: Waking up Watchtower to swap out the containers..."
ssh $NAS_USER@$NAS_IP "docker restart yesmarttutor-watchtower"

echo ""
echo "✅ Deployment Successful! The NAS is officially running the newest code."
