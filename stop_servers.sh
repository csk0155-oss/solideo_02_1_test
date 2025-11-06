#!/bin/bash

echo "Stopping System Monitor Servers..."

# Stop backend
pkill -f "python.*app.py"
echo "Backend server stopped"

# Stop frontend
pkill -f "python.*http.server.*8000"
echo "Frontend server stopped"

echo "All servers stopped successfully"
