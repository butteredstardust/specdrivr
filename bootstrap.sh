#!/bin/bash

# Exit on error
set -e

echo "Starting bootstrap process for Specdrivr..."

# Update and install basic dependencies
echo "Installing prerequisites..."
sudo apt-get update
sudo apt-get install -y curl git build-essential

# Install Node.js 18.x
echo "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
echo "Installing PostgreSQL..."
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL service
echo "Starting PostgreSQL service..."
sudo service postgresql start || sudo systemctl start postgresql

# Configure PostgreSQL
echo "Configuring PostgreSQL database and user..."
sudo -u postgres psql -c "CREATE USER specdrivr WITH PASSWORD 'specdrivr_password';" || true
sudo -u postgres psql -c "CREATE DATABASE specdrivr;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE specdrivr TO specdrivr;"
sudo -u postgres psql -c "ALTER DATABASE specdrivr OWNER TO specdrivr;"

# Clone repository if not already in it
if [ ! -f "package.json" ]; then
    echo "Cloning Specdrivr repository..."
    git clone https://github.com/butteredstardust/specdrivr.git
    cd specdrivr
fi

# Install npm dependencies
echo "Installing npm dependencies..."
npm install

# Setup environment variables
echo "Setting up environment variables..."
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
fi

# Run setup commands
echo "Running database setup and seeding..."
npm run setup

echo "Bootstrap complete! You can now start the application with 'npm run dev' or 'npm run dev:seed'."
