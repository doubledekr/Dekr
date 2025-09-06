#!/bin/bash

echo "🚀 Starting asset migration using Firebase Functions..."

# Set the project
firebase use dekr-nextgen

# Deploy the function first
echo "📦 Deploying uploadLessonAudio function..."
firebase deploy --only functions:uploadLessonAudio

# Run the function
echo "🎯 Running asset migration..."
firebase functions:shell

echo "✅ Asset migration completed!"
