#!/usr/bin/env python3
"""
Setup script for Dekr Podcast Generator
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def install_requirements():
    """Install required Python packages"""
    print("Installing Python requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing requirements: {e}")
        return False
    return True

def setup_environment():
    """Setup environment variables"""
    print("Setting up environment...")
    
    env_file = Path(".env")
    if not env_file.exists():
        print("Creating .env file from template...")
        with open(".env.example", "r") as f:
            template = f.read()
        
        with open(".env", "w") as f:
            f.write(template)
        
        print("✅ .env file created. Please update it with your API keys.")
    else:
        print("✅ .env file already exists")

def create_directories():
    """Create necessary directories"""
    print("Creating directories...")
    
    directories = [
        "audio_files",
        "temp",
        "logs"
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✅ Created directory: {directory}")

def setup_firebase():
    """Setup Firebase configuration"""
    print("Setting up Firebase...")
    
    firebase_config = {
        "type": "service_account",
        "project_id": "alpha-orbit",
        "private_key_id": "your-private-key-id",
        "private_key": "your-private-key",
        "client_email": "your-client-email",
        "client_id": "your-client-id",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "your-client-cert-url"
    }
    
    config_file = Path("firebase-service-account.json")
    if not config_file.exists():
        print("Creating Firebase service account template...")
        with open("firebase-service-account.json", "w") as f:
            json.dump(firebase_config, f, indent=2)
        
        print("✅ Firebase service account template created. Please update it with your actual credentials.")
    else:
        print("✅ Firebase service account file already exists")

def main():
    """Main setup function"""
    print("🚀 Setting up Dekr Podcast Generator...")
    print("=" * 50)
    
    # Install requirements
    if not install_requirements():
        print("❌ Setup failed at requirements installation")
        return
    
    # Setup environment
    setup_environment()
    
    # Create directories
    create_directories()
    
    # Setup Firebase
    setup_firebase()
    
    print("=" * 50)
    print("✅ Setup completed successfully!")
    print("\nNext steps:")
    print("1. Update .env file with your API keys")
    print("2. Update firebase-service-account.json with your Firebase credentials")
    print("3. Add your intro audio files to the audio_files directory")
    print("4. Run: python podcast_generator.py")
    print("\nFor development server: uvicorn podcast_generator:app --reload")

if __name__ == "__main__":
    main()
