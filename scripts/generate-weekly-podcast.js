#!/usr/bin/env node

/**
 * Script to generate a demo weekly community podcast
 * This demonstrates the WeeklyPodcastService functionality
 */

const { weeklyPodcastService } = require('../services/WeeklyPodcastService.ts');

async function generateDemoWeeklyPodcast() {
  try {
    console.log('🎙️ Starting demo weekly community podcast generation...');
    console.log('This will create a 5-10 minute podcast with:');
    console.log('- Top news and market events');
    console.log('- Community member highlights');
    console.log('- Market sentiment analysis');
    console.log('- Educational content');
    console.log('- Upcoming week preview');
    console.log('');

    // Generate the weekly podcast
    const podcast = await weeklyPodcastService.generateWeeklyPodcast();
    
    console.log('✅ Demo weekly podcast generated successfully!');
    console.log('');
    console.log('📊 Podcast Details:');
    console.log(`- Title: ${podcast.title}`);
    console.log(`- Duration: ${Math.floor(podcast.duration / 60)} minutes`);
    console.log(`- Week of: ${podcast.weekOf}`);
    console.log(`- Status: ${podcast.status}`);
    console.log('');
    console.log('📈 Data Sources:');
    console.log(`- News Articles: ${podcast.dataSources.newsCount}`);
    console.log(`- Stock Data: ${podcast.dataSources.stockCount}`);
    console.log(`- Crypto Data: ${podcast.dataSources.cryptoCount}`);
    console.log(`- Community Members: ${podcast.dataSources.communityMembers}`);
    console.log(`- Top Performers: ${podcast.dataSources.topPerformers}`);
    console.log('');
    console.log('🎵 Audio:');
    console.log(`- URL: ${podcast.audioUrl}`);
    console.log('');
    console.log('📝 Script Preview (first 500 characters):');
    console.log(podcast.script.substring(0, 500) + '...');
    console.log('');
    console.log('🎯 Community Highlights:');
    podcast.content.communityHighlights.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} (${member.level}) - ${member.weeklyPerformance.return > 0 ? '+' : ''}${member.weeklyPerformance.return.toFixed(1)}% return`);
    });
    console.log('');
    console.log('📰 Top News:');
    podcast.content.topNews.forEach((news, index) => {
      console.log(`${index + 1}. ${news.headline} (${news.sentiment})`);
    });
    console.log('');
    console.log('📈 Top Stocks:');
    podcast.content.topStocks.forEach((stock, index) => {
      console.log(`${index + 1}. ${stock.name} (${stock.symbol}) - ${stock.changePercentage > 0 ? '+' : ''}${stock.changePercentage?.toFixed(1)}%`);
    });
    console.log('');
    console.log('🎉 Demo weekly podcast generation complete!');
    console.log('The podcast has been saved to Firebase Storage and Firestore.');
    console.log('You can now play it in the Dekr app or access it via the audio URL.');
    
  } catch (error) {
    console.error('❌ Error generating demo weekly podcast:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generateDemoWeeklyPodcast();
}

module.exports = { generateDemoWeeklyPodcast };
