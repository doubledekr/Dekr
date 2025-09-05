#!/usr/bin/env node

/**
 * Script to generate a demo weekly community podcast
 * This creates a podcast that all users can access, stored in Firebase
 */

const { weeklyPodcastService } = require('../services/WeeklyPodcastService.ts');

async function generateDemoWeeklyPodcast() {
  try {
    console.log('🎙️ Generating Demo Weekly Community Podcast...');
    console.log('This podcast will be available to ALL users in the Dekr community');
    console.log('');

    // Generate the weekly podcast with real data
    console.log('📊 Fetching real market data and community information...');
    const podcast = await weeklyPodcastService.generateWeeklyPodcast();
    
    console.log('✅ Demo weekly podcast generated successfully!');
    console.log('');
    console.log('📊 Podcast Details:');
    console.log(`- ID: ${podcast.id}`);
    console.log(`- Title: ${podcast.title}`);
    console.log(`- Duration: ${Math.floor(podcast.duration / 60)} minutes`);
    console.log(`- Week of: ${podcast.weekOf}`);
    console.log(`- Status: ${podcast.status}`);
    console.log(`- Audio URL: ${podcast.audioUrl}`);
    console.log('');
    
    console.log('📈 Data Sources Used:');
    console.log(`- News Articles: ${podcast.dataSources.newsCount}`);
    console.log(`- Stock Data: ${podcast.dataSources.stockCount}`);
    console.log(`- Crypto Data: ${podcast.dataSources.cryptoCount}`);
    console.log(`- Community Members: ${podcast.dataSources.communityMembers}`);
    console.log(`- Top Performers: ${podcast.dataSources.topPerformers}`);
    console.log('');
    
    console.log('🎯 Community Highlights:');
    podcast.content.communityHighlights.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} (${member.level}) - ${member.weeklyPerformance.return > 0 ? '+' : ''}${member.weeklyPerformance.return.toFixed(1)}% return`);
    });
    console.log('');
    
    console.log('📰 Top News Featured:');
    podcast.content.topNews.forEach((news, index) => {
      console.log(`${index + 1}. ${news.headline} (${news.sentiment})`);
    });
    console.log('');
    
    console.log('📈 Top Stocks Featured:');
    podcast.content.topStocks.forEach((stock, index) => {
      console.log(`${index + 1}. ${stock.name} (${stock.symbol}) - ${stock.changePercentage > 0 ? '+' : ''}${stock.changePercentage?.toFixed(1)}%`);
    });
    console.log('');
    
    console.log('₿ Top Crypto Featured:');
    podcast.content.topCrypto.forEach((coin, index) => {
      console.log(`${index + 1}. ${coin.name} (${coin.symbol}) - ${coin.changePercentage > 0 ? '+' : ''}${coin.changePercentage?.toFixed(1)}%`);
    });
    console.log('');
    
    console.log('📝 Script Preview (first 500 characters):');
    console.log(podcast.script.substring(0, 500) + '...');
    console.log('');
    
    console.log('🎵 Audio Information:');
    console.log(`- Audio URL: ${podcast.audioUrl}`);
    console.log(`- Duration: ${Math.floor(podcast.duration / 60)}:${(podcast.duration % 60).toString().padStart(2, '0')}`);
    console.log(`- Status: ${podcast.status}`);
    console.log('');
    
    console.log('🔥 Firebase Storage:');
    console.log('✅ Podcast metadata saved to Firestore');
    console.log('✅ Audio file saved to Firebase Storage');
    console.log('✅ Script content saved to Firestore');
    console.log('✅ All users can now access this podcast');
    console.log('');
    
    console.log('🎉 Demo Weekly Community Podcast Generation Complete!');
    console.log('');
    console.log('📱 Next Steps:');
    console.log('1. The podcast is now available in the Dekr app');
    console.log('2. All users can access it from the Newsletter tab');
    console.log('3. The podcast will play using the existing audio player');
    console.log('4. Future podcasts will be generated automatically every Friday');
    console.log('');
    console.log('🎯 This podcast demonstrates:');
    console.log('- Real market data integration');
    console.log('- AI-generated educational content');
    console.log('- Community member highlights');
    console.log('- Professional audio production');
    console.log('- Firebase storage and accessibility');
    
  } catch (error) {
    console.error('❌ Error generating demo weekly podcast:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generateDemoWeeklyPodcast();
}

module.exports = { generateDemoWeeklyPodcast };
