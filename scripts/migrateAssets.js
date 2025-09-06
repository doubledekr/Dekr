const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin using default credentials
admin.initializeApp({
  projectId: 'alpha-orbit',
  storageBucket: 'alpha-orbit.appspot.com'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function migrateAssets() {
  console.log('🚀 Starting asset migration...');
  
  const assetsDir = path.join(__dirname, '../assets/audio');
  
  if (!fs.existsSync(assetsDir)) {
    throw new Error(`Assets directory not found: ${assetsDir}`);
  }

  // Get all MP3 files from the assets directory
  const audioFiles = fs.readdirSync(assetsDir)
    .filter(file => file.endsWith('.mp3') && !file.startsWith('.'))
    .sort();

  console.log(`📁 Found ${audioFiles.length} audio files to upload`);

  const results = {
    total: audioFiles.length,
    completed: 0,
    failed: 0,
    errors: []
  };

  // Process each audio file
  for (const filename of audioFiles) {
    try {
      console.log(`📤 Processing: ${filename}`);
      
      const lessonMetadata = await uploadSingleLessonAudio(filename, assetsDir);
      
      results.completed++;
      console.log(`✅ Uploaded: ${filename} (${results.completed}/${results.total})`);
      
    } catch (error) {
      results.failed++;
      const errorMsg = `Failed to upload ${filename}: ${error.message}`;
      results.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  // Upload intro stingers
  await uploadIntroStingers(assetsDir);

  console.log('🎉 Migration completed!');
  console.log(`📊 Results: ${results.completed} uploaded, ${results.failed} failed`);
  
  if (results.errors.length > 0) {
    console.log('❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  return results;
}

async function uploadSingleLessonAudio(filename, assetsDir) {
  const filePath = path.join(assetsDir, filename);
  
  // Parse lesson information from filename
  const lessonInfo = parseLessonFilename(filename);
  if (!lessonInfo) {
    throw new Error(`Invalid lesson filename format: ${filename}`);
  }

  // Define storage path
  const storagePath = `dekr-content/audio/lessons/stage_${lessonInfo.stage}/${filename}`;
  
  // Upload file to Firebase Storage
  const file = bucket.file(storagePath);
  const stream = fs.createReadStream(filePath);
  
  await new Promise((resolve, reject) => {
    stream.pipe(file.createWriteStream({
      metadata: {
        contentType: 'audio/mpeg',
        metadata: {
          originalName: filename,
          stage: lessonInfo.stage.toString(),
          lessonNumber: lessonInfo.lessonNumber.toString(),
          uploadedAt: new Date().toISOString()
        }
      }
    }))
    .on('error', reject)
    .on('finish', resolve);
  });

  // Make the file publicly readable
  await file.makePublic();

  // Get the public URL
  const audioUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

  // Create lesson metadata
  const lessonMetadata = {
    id: `lesson_${lessonInfo.stage}_${lessonInfo.lessonNumber}`,
    stage: lessonInfo.stage,
    lessonNumber: lessonInfo.lessonNumber,
    title: generateLessonTitle(lessonInfo.stage, lessonInfo.lessonNumber),
    description: generateLessonDescription(lessonInfo.stage, lessonInfo.lessonNumber),
    duration: 120, // Default 2 minutes
    xpReward: calculateXPReward(lessonInfo.stage, lessonInfo.lessonNumber),
    audioUrl,
    storagePath,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  };

  // Save to Firestore
  await db.collection('educationContent').doc(lessonMetadata.id).set(lessonMetadata);

  return lessonMetadata;
}

function parseLessonFilename(filename) {
  const match = filename.match(/^lesson_(\d+)_(\d+)\.mp3$/);
  if (!match) {
    return null;
  }
  
  return {
    stage: parseInt(match[1], 10),
    lessonNumber: parseInt(match[2], 10)
  };
}

function generateLessonTitle(stage, lessonNumber) {
  const stageTitles = {
    1: 'Core Money Skills',
    2: 'Advanced Financial Concepts',
    3: 'Investment Strategies'
  };
  
  const stageTitle = stageTitles[stage] || `Stage ${stage}`;
  return `Lesson ${lessonNumber}: ${stageTitle}`;
}

function generateLessonDescription(stage, lessonNumber) {
  const descriptions = {
    1: 'Learn the essential basics of money and finance',
    2: 'Master advanced financial concepts and strategies',
    3: 'Explore sophisticated investment strategies and portfolio management'
  };
  
  return descriptions[stage] || `Educational content for stage ${stage}, lesson ${lessonNumber}`;
}

function calculateXPReward(stage, lessonNumber) {
  const baseXP = 20;
  const stageMultiplier = stage * 5;
  const lessonBonus = Math.floor(lessonNumber / 5) * 5;
  
  return baseXP + stageMultiplier + lessonBonus;
}

async function uploadIntroStingers(assetsDir) {
  const introFiles = ['Podcast Intro.mp3', 'Fashion Podcast Intro.mp3'];
  
  for (const filename of introFiles) {
    const filePath = path.join(assetsDir, filename);
    
    if (fs.existsSync(filePath)) {
      const storagePath = `dekr-content/audio/intro_stingers/${filename}`;
      const file = bucket.file(storagePath);
      const stream = fs.createReadStream(filePath);
      
      await new Promise((resolve, reject) => {
        stream.pipe(file.createWriteStream({
          metadata: {
            contentType: 'audio/mpeg',
            metadata: {
              originalName: filename,
              type: 'intro_stinger',
              uploadedAt: new Date().toISOString()
            }
          }
        }))
        .on('error', reject)
        .on('finish', resolve);
      });
      
      await file.makePublic();
      console.log(`✅ Uploaded intro stinger: ${filename}`);
    }
  }
}

// Run the migration
if (require.main === module) {
  migrateAssets()
    .then(() => {
      console.log('✅ Asset migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Asset migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateAssets };
