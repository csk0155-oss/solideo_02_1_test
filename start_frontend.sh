#!/bin/bash

echo "Starting System Monitor Frontend..."
echo "Opening http://localhost:8000"
echo "Press Ctrl+C to stop the server"
cd frontend
python3 -m http.server 8000
