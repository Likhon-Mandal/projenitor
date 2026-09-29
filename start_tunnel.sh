#!/bin/bash
echo "======================================================"
echo " Starting Projenitor Secure Cloudflare Tunnel"
echo " Target: http://localhost:5173 (Frontend + Backend API)"
echo "======================================================"

if command -v cloudflared &> /dev/null; then
    cloudflared tunnel --url http://localhost:5173
else
    echo "cloudflared not found, falling back to localhost.run..."
    ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:localhost:5173 nokey@localhost.run
fi

