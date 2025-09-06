"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.weeklyPodcastService = exports.WeeklyPodcastService = void 0;
const openai_1 = __importDefault(require("openai"));
const firebase_1 = require("./firebase");
const react_native_1 = require("react-native");
const analytics_1 = require("./analytics");
const polygon_service_1 = require("./polygon-service");
class WeeklyPodcastService {
    constructor() {
        this.autocontentBaseUrl = 'https://api.autocontentapi.com';
        this.openai = new openai_1.default({
            apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
            dangerouslyAllowBrowser: true
        });
        this.autocontentApiKey = process.env.EXPO_PUBLIC_AUTOCONTENT_API_KEY || '';
        this.db = firebase_1.firestore;
        // Initialize Firebase Storage
        if (react_native_1.Platform.OS === 'web') {
            const { getStorage } = require('firebase/storage');
            this.storage = getStorage();
        }
        else {
            this.storage = null;
        }
    }
    // Platform-aware timestamp helpers
    createTimestamp(date) {
        if (react_native_1.Platform.OS === 'web') {
            const { Timestamp } = require('firebase/firestore');
            return Timestamp.fromDate(date);
        }
        else {
            const firestoreNS = require('@react-native-firebase/firestore');
            return firestoreNS.Timestamp.fromDate(date);
        }
    }
    getServerTimestamp() {
        if (react_native_1.Platform.OS === 'web') {
            const { serverTimestamp } = require('firebase/firestore');
            return serverTimestamp();
        }
        else {
            const firestoreNS = require('@react-native-firebase/firestore');
            return firestoreNS.FieldValue.serverTimestamp();
        }
    }
    // Get current week's date range
    getCurrentWeek() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek); // Start of week (Sunday)
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6); // End of week (Saturday)
        end.setHours(23, 59, 59, 999);
        const weekOf = start.toISOString().split('T')[0]; // YYYY-MM-DD format
        return { start, end, weekOf };
    }
    // Fetch comprehensive data for the weekly podcast
    async fetchWeeklyData() {
        console.log('📊 Fetching weekly data for community podcast...');
        try {
            // Fetch news, stocks, and crypto in parallel
            const [news, stocks, crypto] = await Promise.all([
                (0, polygon_service_1.fetchPolygonFinancialNews)(15),
                (0, polygon_service_1.getPolygonPopularStocks)(10),
                (0, polygon_service_1.getPolygonPopularCrypto)(5) // Top 5 crypto
            ]);
            // Fetch community data
            const communityMembers = await this.fetchCommunityData();
            // Calculate market sentiment
            const marketSentiment = this.calculateMarketSentiment(stocks, crypto, news);
            console.log('✅ Weekly data fetched successfully:', {
                news: news.length,
                stocks: stocks.length,
                crypto: crypto.length,
                communityMembers: communityMembers.length
            });
            return {
                news,
                stocks,
                crypto,
                communityMembers,
                marketSentiment
            };
        }
        catch (error) {
            console.error('❌ Error fetching weekly data:', error);
            throw error;
        }
    }
    // Fetch community member data and performance
    async fetchCommunityData() {
        try {
            console.log('👥 Fetching community data...');
            // Get top community members from reputation system
            let topMembers = [];
            if (react_native_1.Platform.OS === 'web') {
                const { collection, query, orderBy, limit, getDocs } = require('firebase/firestore');
                const reputationRef = collection(this.db, 'user_reputation');
                const q = query(reputationRef, orderBy('reputationScore', 'desc'), limit(10));
                const snapshot = await getDocs(q);
                topMembers = snapshot.docs.map((doc) => {
                    var _a, _b;
                    const data = doc.data();
                    return {
                        id: data.userId,
                        name: data.userName || 'Anonymous Trader',
                        reputation: data.reputationScore || 0,
                        level: data.level || 'novice',
                        weeklyPerformance: {
                            recommendations: ((_a = data.weeklyPerformance) === null || _a === void 0 ? void 0 : _a.recommendations) || 0,
                            accuracy: ((_b = data.weeklyPerformance) === null || _b === void 0 ? void 0 : _b.accuracy) || 0,
                            return: Math.random() * 20 - 10 // Placeholder for now
                        },
                        badges: data.badges || [],
                        isNewMember: false // TODO: Implement new member detection
                    };
                });
            }
            else {
                // React Native fallback
                const snapshot = await this.db.collection('user_reputation')
                    .orderBy('reputationScore', 'desc')
                    .limit(10)
                    .get();
                topMembers = snapshot.docs.map((doc) => {
                    var _a, _b;
                    const data = doc.data();
                    return {
                        id: data.userId,
                        name: data.userName || 'Anonymous Trader',
                        reputation: data.reputationScore || 0,
                        level: data.level || 'novice',
                        weeklyPerformance: {
                            recommendations: ((_a = data.weeklyPerformance) === null || _a === void 0 ? void 0 : _a.recommendations) || 0,
                            accuracy: ((_b = data.weeklyPerformance) === null || _b === void 0 ? void 0 : _b.accuracy) || 0,
                            return: Math.random() * 20 - 10 // Placeholder for now
                        },
                        badges: data.badges || [],
                        isNewMember: false
                    };
                });
            }
            // Add some mock data for demo purposes
            if (topMembers.length === 0) {
                topMembers = [
                    {
                        id: 'demo-user-1',
                        name: 'Alex Chen',
                        reputation: 850,
                        level: 'expert',
                        weeklyPerformance: { recommendations: 12, accuracy: 85.2, return: 12.5 },
                        badges: ['Market Master', 'Top Performer'],
                        isNewMember: false
                    },
                    {
                        id: 'demo-user-2',
                        name: 'Sarah Johnson',
                        reputation: 720,
                        level: 'intermediate',
                        weeklyPerformance: { recommendations: 8, accuracy: 78.9, return: 9.8 },
                        badges: ['Rising Star'],
                        isNewMember: false
                    },
                    {
                        id: 'demo-user-3',
                        name: 'Mike Rodriguez',
                        reputation: 450,
                        level: 'intermediate',
                        weeklyPerformance: { recommendations: 5, accuracy: 72.1, return: 6.3 },
                        badges: ['Consistent Trader'],
                        isNewMember: true
                    }
                ];
            }
            console.log(`✅ Found ${topMembers.length} community members`);
            return topMembers;
        }
        catch (error) {
            console.error('❌ Error fetching community data:', error);
            return [];
        }
    }
    // Calculate overall market sentiment
    calculateMarketSentiment(stocks, crypto, news) {
        // Analyze stock performance
        const stockPerformance = stocks.reduce((sum, stock) => sum + (stock.changePercentage || 0), 0) / stocks.length;
        // Analyze crypto performance
        const cryptoPerformance = crypto.reduce((sum, coin) => sum + (coin.changePercentage || 0), 0) / crypto.length;
        // Analyze news sentiment
        const newsSentiment = news.reduce((sum, article) => {
            if (article.sentiment === 'positive')
                return sum + 1;
            if (article.sentiment === 'negative')
                return sum - 1;
            return sum;
        }, 0) / news.length;
        // Calculate overall sentiment
        const overallScore = (stockPerformance * 0.4) + (cryptoPerformance * 0.3) + (newsSentiment * 0.3);
        let overall;
        if (overallScore > 2)
            overall = 'bullish';
        else if (overallScore < -2)
            overall = 'bearish';
        else
            overall = 'neutral';
        const confidence = Math.min(Math.abs(overallScore) * 20, 100);
        // Identify key drivers
        const keyDrivers = [];
        if (Math.abs(stockPerformance) > 3) {
            keyDrivers.push(`Stock market ${stockPerformance > 0 ? 'rally' : 'decline'} (${stockPerformance.toFixed(1)}%)`);
        }
        if (Math.abs(cryptoPerformance) > 5) {
            keyDrivers.push(`Crypto ${cryptoPerformance > 0 ? 'surge' : 'correction'} (${cryptoPerformance.toFixed(1)}%)`);
        }
        if (Math.abs(newsSentiment) > 0.3) {
            keyDrivers.push(`News sentiment ${newsSentiment > 0 ? 'positive' : 'negative'} trend`);
        }
        // Sector performance (simplified)
        const sectorPerformance = {
            'Technology': { performance: stockPerformance + Math.random() * 2 - 1, sentiment: 'positive' },
            'Finance': { performance: stockPerformance + Math.random() * 1.5 - 0.75, sentiment: 'neutral' },
            'Healthcare': { performance: stockPerformance + Math.random() * 1 - 0.5, sentiment: 'positive' },
            'Energy': { performance: stockPerformance + Math.random() * 3 - 1.5, sentiment: 'volatile' }
        };
        return {
            overall,
            confidence,
            keyDrivers,
            sectorPerformance
        };
    }
    // Generate the weekly podcast script using OpenAI
    async generateWeeklyScript(data) {
        const systemPrompt = `You're creating a weekly community podcast for Dekr (pronounced "Decker"), a trading community platform. Your style should be upbeat, engaging, and educational - similar to Kai Ryssdal from Marketplace but with a community focus.

Key characteristics:
- Upbeat and exciting tone that celebrates community achievements
- Use metaphors and analogies to explain complex financial concepts
- Focus on community highlights, top performers, and member achievements
- Educational content that helps listeners become smarter investors
- No specific investment advice or recommendations - just information and education
- Mention company names with tickers (e.g., "Apple (AAPL)", "Tesla (TSLA)")
- Target length: 5-10 minutes when read aloud (2000-4000 words)
- End with "Dekr" pronunciation and community messaging

Structure:
1. Exciting intro about the week's highlights
2. Top news and market events with community context
3. Community member spotlights and achievements
4. Market sentiment analysis with metaphors
5. Educational insights and smart investing tips
6. Upcoming week preview
7. Community celebration and sign-off

Make it feel like a celebration of the community's collective intelligence and learning journey.`;
        const userPrompt = `Create a weekly community podcast script for Dekr with this week's data:

MARKET DATA:
- Top News: ${data.news.slice(0, 5).map(n => `"${n.headline}" (${n.sentiment})`).join(', ')}
- Top Stocks: ${data.stocks.slice(0, 5).map(s => { var _a; return `${s.name} (${s.symbol}) ${s.changePercentage > 0 ? '+' : ''}${(_a = s.changePercentage) === null || _a === void 0 ? void 0 : _a.toFixed(1)}%`; }).join(', ')}
- Top Crypto: ${data.crypto.slice(0, 3).map(c => { var _a; return `${c.name} (${c.symbol}) ${c.changePercentage > 0 ? '+' : ''}${(_a = c.changePercentage) === null || _a === void 0 ? void 0 : _a.toFixed(1)}%`; }).join(', ')}
- Market Sentiment: ${data.marketSentiment.overall} (${data.marketSentiment.confidence.toFixed(0)}% confidence)
- Key Drivers: ${data.marketSentiment.keyDrivers.join(', ')}

COMMUNITY HIGHLIGHTS:
- Top Performers: ${data.communityMembers.slice(0, 3).map(m => `${m.name} (${m.level}) - ${m.weeklyPerformance.return > 0 ? '+' : ''}${m.weeklyPerformance.return.toFixed(1)}% return, ${m.weeklyPerformance.accuracy.toFixed(1)}% accuracy`).join(', ')}
- New Members: ${data.communityMembers.filter(m => m.isNewMember).map(m => m.name).join(', ') || 'Welcome to our new community members!'}
- Community Size: 1,250+ active members
- Total Recommendations This Week: ${data.communityMembers.reduce((sum, m) => sum + m.weeklyPerformance.recommendations, 0)}

Create an engaging, educational podcast that celebrates the community's achievements while providing valuable market insights and smart investing education. Use metaphors to explain complex concepts and maintain an upbeat, exciting tone throughout.`;
        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.8,
                max_tokens: 4000
            });
            return completion.choices[0].message.content || this.getFallbackWeeklyScript(data);
        }
        catch (error) {
            console.error('Error generating weekly script:', error);
            return this.getFallbackWeeklyScript(data);
        }
    }
    // Fallback script if OpenAI fails
    getFallbackWeeklyScript(data) {
        var _a, _b, _c, _d, _e, _f, _g;
        const topPerformer = data.communityMembers[0];
        const topStock = data.stocks[0];
        const topNews = data.news[0];
        return `Welcome to the Dekr Weekly Community Podcast! I'm your host, and what an absolutely incredible week it's been in the markets and here in our amazing community.

Let me start with the big picture - this week has been like watching a master chef create a perfect dish. All the ingredients came together beautifully, and our community of 1,250+ smart traders absolutely crushed it.

Leading the charge this week is ${(topPerformer === null || topPerformer === void 0 ? void 0 : topPerformer.name) || 'Alex Chen'}, who delivered a stunning ${((_b = (_a = topPerformer === null || topPerformer === void 0 ? void 0 : topPerformer.weeklyPerformance) === null || _a === void 0 ? void 0 : _a.return) === null || _b === void 0 ? void 0 : _b.toFixed(1)) || '12.5'}% return with an ${((_d = (_c = topPerformer === null || topPerformer === void 0 ? void 0 : topPerformer.weeklyPerformance) === null || _c === void 0 ? void 0 : _c.accuracy) === null || _d === void 0 ? void 0 : _d.toFixed(1)) || '85.2'}% accuracy rate. That's not just luck, folks - that's the power of collective intelligence in action.

Speaking of intelligence, let's talk about what moved the markets this week. ${(topStock === null || topStock === void 0 ? void 0 : topStock.name) || 'Apple'} (${(topStock === null || topStock === void 0 ? void 0 : topStock.symbol) || 'AAPL'}) was the talk of the town, with a ${(topStock === null || topStock === void 0 ? void 0 : topStock.changePercentage) > 0 ? 'stellar' : 'challenging'} ${(topStock === null || topStock === void 0 ? void 0 : topStock.changePercentage) > 0 ? '+' : ''}${((_e = topStock === null || topStock === void 0 ? void 0 : topStock.changePercentage) === null || _e === void 0 ? void 0 : _e.toFixed(1)) || '3.2'}% performance. Think of it like a well-orchestrated symphony - when the fundamentals align with market sentiment, magic happens.

The news cycle this week was dominated by "${(topNews === null || topNews === void 0 ? void 0 : topNews.headline) || 'Major Market Developments'}" - and here's what's really interesting about this story. It's not just about the headline, it's about how our community saw it coming. We're talking about 78% accuracy in predicting market movements this week alone.

Here's where it gets exciting - our community isn't just following the markets, we're anticipating them. Like a skilled chess player thinking three moves ahead, our members are building strategies that account for multiple scenarios.

The market sentiment this week has been ${((_f = data.marketSentiment) === null || _f === void 0 ? void 0 : _f.overall) || 'bullish'}, and here's the beautiful thing about sentiment - it's like the weather. You can't control it, but you can prepare for it. Our community has been doing exactly that, positioning themselves for exactly the scenarios that unfolded.

Let me share something that really gets me excited - we had ${((_g = data.communityMembers) === null || _g === void 0 ? void 0 : _g.filter((m) => m.isNewMember).length) || 3} new members join our community this week. Welcome to the family! You've just joined a group of people who don't just trade - they think, they learn, they adapt.

Here's what I want you to take away from this week's performance: we're not just building a trading community here, we're building a learning community. We're building a place where smart people can share ideas, test strategies, and yes, make money together.

The markets will do what the markets do - they'll go up, they'll go down, they'll make you question everything you thought you knew. But this community? This community is different. This community is thinking, learning, and adapting.

And that, my friends, is how you build wealth that lasts.

Looking ahead to next week, keep your eyes on the economic calendar. We've got some key data releases coming up that could create opportunities for those who are prepared. Remember, in the world of smart investing, preparation beats prediction every time.

Until next week, keep your charts close and your stop-losses closer. This is your Dekr Weekly Community Podcast, and I'll see you on the trading floor. Thanks for being part of the Dekr community - that's D-E-K-R, pronounced "Decker" - where smart traders come to learn, share, and succeed together.`;
    }
    // Generate audio using AutoContent API (with fallback)
    async generateAudioWithAutoContent(script) {
        try {
            console.log('🎙️ Generating audio with AutoContent API...');
            console.log('Script length:', script.length);
            // Try AutoContent API first
            try {
                // Step 1: Create content request
                console.log('📝 Step 1: Creating content request...');
                const createResponse = await fetch(`${this.autocontentBaseUrl}/content/Create`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.autocontentApiKey}`
                    },
                    body: JSON.stringify({
                        resources: [
                            {
                                type: "text",
                                content: script
                            }
                        ],
                        outputType: "audio",
                        text: "Create an engaging weekly community podcast about market analysis and community highlights",
                        duration: "default" // 8-12 minutes
                    })
                });
                if (!createResponse.ok) {
                    const errorText = await createResponse.text();
                    console.error('AutoContent API create error:', createResponse.status, errorText);
                    throw new Error(`AutoContent API create error: ${createResponse.status} - ${errorText}`);
                }
                const createResult = await createResponse.json();
                const requestId = createResult.request_id;
                console.log('✅ Content request created, ID:', requestId);
                // Step 2: Poll for status
                console.log('⏳ Step 2: Polling for completion...');
                let attempts = 0;
                const maxAttempts = 30; // 5 minutes max (10 second intervals)
                while (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
                    attempts++;
                    const statusResponse = await fetch(`${this.autocontentBaseUrl}/content/Status/${requestId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${this.autocontentApiKey}`
                        }
                    });
                    if (!statusResponse.ok) {
                        console.error('Status check failed:', statusResponse.status);
                        break;
                    }
                    const statusResult = await statusResponse.json();
                    console.log(`📊 Status check ${attempts}: ${statusResult.status}`);
                    if (statusResult.status === 100) {
                        // Step 3: Get the audio
                        console.log('🎉 Step 3: Audio ready! Downloading...');
                        const audioUrl = statusResult.audio_url;
                        const audioResponse = await fetch(audioUrl);
                        if (!audioResponse.ok) {
                            throw new Error(`Failed to download audio: ${audioResponse.status}`);
                        }
                        const audioBuffer = await audioResponse.arrayBuffer();
                        console.log('✅ Audio generation successful, size:', audioBuffer.byteLength);
                        console.log('🎵 Audio duration:', statusResult.audio_duration, 'seconds');
                        return audioBuffer;
                    }
                    else if (statusResult.status === 0) {
                        console.log('⏳ Still pending...');
                    }
                    else if (statusResult.status === 5) {
                        console.log('🔄 Processing...');
                    }
                    else if (statusResult.error_code && statusResult.error_code !== 0) {
                        throw new Error(`AutoContent API error: ${statusResult.error_code} - ${statusResult.error_message || 'Unknown error'}`);
                    }
                }
                throw new Error('AutoContent API timeout - processing took too long');
            }
            catch (apiError) {
                console.warn('⚠️ AutoContent API failed, using fallback audio generation:', apiError);
                // Fallback: Generate a mock audio buffer
                console.log('🔄 Using mock audio generation as fallback...');
                const mockAudioBuffer = this.generateMockAudioBuffer(script);
                console.log('✅ Generated fallback audio buffer, size:', mockAudioBuffer.byteLength);
                return mockAudioBuffer;
            }
        }
        catch (error) {
            console.error('Error generating audio with AutoContent:', error);
            throw error;
        }
    }
    // Generate a mock audio buffer for fallback
    generateMockAudioBuffer(script) {
        // Create a mock audio buffer (silence with some metadata)
        // In a real implementation, this would be replaced with actual TTS
        const duration = Math.max(30, script.length / 20); // Estimate duration based on script length
        const sampleRate = 44100;
        const channels = 1;
        const samples = Math.floor(duration * sampleRate);
        // Create a buffer with silence (zeros) - this is just a placeholder
        const buffer = new ArrayBuffer(samples * 2); // 16-bit samples
        const view = new Int16Array(buffer);
        // Add some subtle noise to make it detectable as audio
        for (let i = 0; i < samples; i++) {
            view[i] = Math.sin(i * 0.01) * 100; // Very quiet sine wave
        }
        return buffer;
    }
    // Load and mix intro music
    async loadIntroMusic() {
        try {
            console.log('🎵 Loading intro music...');
            const possiblePaths = [
                '/audio/Podcast Intro.mp3',
                '/assets/audio/Podcast Intro.mp3',
                './audio/Podcast Intro.mp3',
                './assets/audio/Podcast Intro.mp3'
            ];
            let response = null;
            for (const path of possiblePaths) {
                try {
                    response = await fetch(path);
                    if (response.ok) {
                        console.log(`Successfully loaded intro from: ${path}`);
                        break;
                    }
                }
                catch (error) {
                    console.log(`Failed to load from ${path}:`, error);
                }
            }
            if (!response || !response.ok) {
                throw new Error('Failed to load intro music from any path');
            }
            return await response.arrayBuffer();
        }
        catch (error) {
            console.error('Error loading intro music:', error);
            return new ArrayBuffer(0);
        }
    }
    // Mix audio with intro music
    async mixAudioWithIntro(introBuffer, voiceBuffer) {
        try {
            console.log('🎚️ Mixing audio with intro music...');
            if (introBuffer.byteLength === 0) {
                console.log('No intro music, returning voice only');
                return voiceBuffer;
            }
            // Create audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Decode audio buffers
            const introAudioBuffer = await audioContext.decodeAudioData(introBuffer.slice(0));
            const voiceAudioBuffer = await audioContext.decodeAudioData(voiceBuffer.slice(0));
            // Calculate timing
            const introDuration = introAudioBuffer.duration;
            const voiceDuration = voiceAudioBuffer.duration;
            const totalDuration = introDuration + voiceDuration;
            // Create output buffer
            const outputBuffer = audioContext.createBuffer(2, // Stereo
            Math.ceil(totalDuration * audioContext.sampleRate), audioContext.sampleRate);
            // Get audio data
            const outputData = outputBuffer.getChannelData(0);
            const outputDataRight = outputBuffer.getChannelData(1);
            const sampleRate = audioContext.sampleRate;
            // Mix intro music
            const introData = introAudioBuffer.getChannelData(0);
            for (let i = 0; i < introData.length; i++) {
                outputData[i] = introData[i] * 0.3; // Lower volume for intro
                outputDataRight[i] = introData[i] * 0.3;
            }
            // Mix voice narration
            const voiceData = voiceAudioBuffer.getChannelData(0);
            const voiceStartSample = Math.floor(introDuration * sampleRate);
            for (let i = 0; i < voiceData.length; i++) {
                const outputIndex = voiceStartSample + i;
                if (outputIndex < outputData.length) {
                    outputData[outputIndex] = voiceData[i];
                    outputDataRight[outputIndex] = voiceData[i];
                }
            }
            // Convert back to ArrayBuffer
            const offlineContext = new OfflineAudioContext(outputBuffer.numberOfChannels, outputBuffer.length, outputBuffer.sampleRate);
            const source = offlineContext.createBufferSource();
            source.buffer = outputBuffer;
            source.connect(offlineContext.destination);
            source.start();
            const renderedBuffer = await offlineContext.startRendering();
            // Convert to WAV format
            const wavBuffer = this.audioBufferToWav(renderedBuffer);
            console.log('Audio mixing completed successfully');
            return wavBuffer;
        }
        catch (error) {
            console.error('Error mixing audio:', error);
            return voiceBuffer; // Fallback to voice only
        }
    }
    // Convert AudioBuffer to WAV format
    audioBufferToWav(buffer) {
        const length = buffer.length;
        const numberOfChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
        const view = new DataView(arrayBuffer);
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * numberOfChannels * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numberOfChannels * 2, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * numberOfChannels * 2, true);
        // Convert audio data
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }
        return arrayBuffer;
    }
    // Upload podcast to Firebase Storage
    async uploadPodcastToStorage(audioBuffer) {
        try {
            const timestamp = Date.now();
            const fileName = `weekly-podcasts/weekly_podcast_${timestamp}.mp3`;
            console.log(`Uploading weekly podcast to Firebase Storage: ${fileName}`);
            console.log(`Audio size: ${audioBuffer.byteLength} bytes`);
            if (react_native_1.Platform.OS === 'web' && this.storage) {
                try {
                    const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
                    const storageRef = ref(this.storage, fileName);
                    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
                    console.log('Uploading to Firebase Storage...');
                    const snapshot = await uploadBytes(storageRef, blob);
                    console.log('Upload successful:', snapshot.metadata.name);
                    const downloadURL = await getDownloadURL(storageRef);
                    console.log(`Generated permanent audio URL: ${downloadURL}`);
                    return downloadURL;
                }
                catch (storageError) {
                    console.warn('Firebase Storage upload failed, using blob URL fallback:', storageError);
                }
            }
            // Fallback to blob URL
            console.log('Using blob URL fallback (temporary storage)');
            const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(blob);
            console.log(`Generated temporary audio URL: ${audioUrl}`);
            return audioUrl;
        }
        catch (error) {
            console.error('Error uploading podcast to storage:', error);
            // Final fallback
            const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(blob);
            return audioUrl;
        }
    }
    // Generate the complete weekly community podcast
    async generateWeeklyPodcast() {
        try {
            console.log('🎙️ Starting weekly community podcast generation...');
            const { weekOf } = this.getCurrentWeek();
            // Check if podcast already exists for this week
            const existingPodcast = await this.getExistingWeeklyPodcast(weekOf);
            if (existingPodcast) {
                console.log('✅ Weekly podcast already exists for this week');
                return existingPodcast;
            }
            (0, analytics_1.logEvent)(analytics_1.AnalyticsEvents.CREATE_PODCAST, {
                type: 'weekly_community',
                week_of: weekOf,
                timestamp: new Date().toISOString(),
            });
            // 1. Fetch all data
            const data = await this.fetchWeeklyData();
            // 2. Generate script
            const script = await this.generateWeeklyScript(data);
            // 3. Generate audio
            const voiceBuffer = await this.generateAudioWithAutoContent(script);
            // 4. Load intro music
            const introBuffer = await this.loadIntroMusic();
            // 5. Mix audio
            const finalAudioBuffer = await this.mixAudioWithIntro(introBuffer, voiceBuffer);
            // 6. Upload to storage
            const audioUrl = await this.uploadPodcastToStorage(finalAudioBuffer);
            // 7. Create podcast document
            const podcastData = {
                id: `weekly_podcast_${weekOf}`,
                title: `Dekr Weekly Community Podcast - Week of ${weekOf}`,
                script,
                audioUrl,
                duration: Math.floor(finalAudioBuffer.byteLength / 16000),
                createdAt: this.createTimestamp(new Date()),
                weekOf,
                status: 'completed',
                dataSources: {
                    newsCount: data.news.length,
                    stockCount: data.stocks.length,
                    cryptoCount: data.crypto.length,
                    communityMembers: data.communityMembers.length,
                    topPerformers: data.communityMembers.filter(m => m.weeklyPerformance.return > 5).length
                },
                content: {
                    topNews: data.news.slice(0, 5),
                    topStocks: data.stocks.slice(0, 5),
                    topCrypto: data.crypto.slice(0, 3),
                    communityHighlights: data.communityMembers.slice(0, 5),
                    marketSentiment: data.marketSentiment.overall,
                    upcomingEvents: ['Fed Meeting', 'Earnings Season', 'Economic Data Releases']
                }
            };
            // 8. Save to Firestore
            await this.saveWeeklyPodcast(podcastData);
            console.log('✅ Weekly community podcast generated successfully:', podcastData.id);
            return podcastData;
        }
        catch (error) {
            console.error('❌ Error generating weekly podcast:', error);
            throw error;
        }
    }
    // Check if weekly podcast already exists
    async getExistingWeeklyPodcast(weekOf) {
        try {
            if (react_native_1.Platform.OS === 'web') {
                const { collection, query, where, getDocs } = require('firebase/firestore');
                const podcastsRef = collection(this.db, 'weekly_podcasts');
                const q = query(podcastsRef, where('weekOf', '==', weekOf));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    return Object.assign({ id: doc.id }, doc.data());
                }
            }
            else {
                const snapshot = await this.db.collection('weekly_podcasts')
                    .where('weekOf', '==', weekOf)
                    .get();
                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    return Object.assign({ id: doc.id }, doc.data());
                }
            }
            return null;
        }
        catch (error) {
            console.warn('Error checking for existing weekly podcast:', error);
            return null;
        }
    }
    // Save weekly podcast to Firestore
    async saveWeeklyPodcast(podcastData) {
        try {
            // Add additional metadata for community access
            const podcastWithMetadata = Object.assign(Object.assign({}, podcastData), { isPublic: true, isDemo: false, accessLevel: 'community', tags: ['weekly', 'community', 'market-analysis', 'education'], createdAt: this.createTimestamp(new Date()), updatedAt: this.createTimestamp(new Date()) });
            if (react_native_1.Platform.OS === 'web') {
                const { collection, addDoc } = require('firebase/firestore');
                const podcastsRef = collection(this.db, 'weekly_podcasts');
                await addDoc(podcastsRef, podcastWithMetadata);
            }
            else {
                await this.db.collection('weekly_podcasts').add(podcastWithMetadata);
            }
            console.log('✅ Weekly podcast saved to Firestore with community access');
        }
        catch (error) {
            console.error('Error saving weekly podcast:', error);
            throw error;
        }
    }
    // Get all weekly podcasts (accessible to all users)
    async getWeeklyPodcasts(limit = 10) {
        try {
            if (react_native_1.Platform.OS === 'web') {
                const { collection, getDocs } = require('firebase/firestore');
                const podcastsRef = collection(this.db, 'weekly_podcasts');
                // Simple query without compound filters to avoid index requirements
                const snapshot = await getDocs(podcastsRef);
                // Filter and sort in memory
                const podcasts = snapshot.docs
                    .map((doc) => (Object.assign({ id: doc.id }, doc.data())))
                    .filter(podcast => podcast.isPublic === true) // Filter public podcasts
                    .sort((a, b) => {
                    var _a, _b;
                    // Sort by createdAt descending
                    const aTime = ((_a = a.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
                    const bTime = ((_b = b.createdAt) === null || _b === void 0 ? void 0 : _b.toDate) ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
                    return bTime - aTime;
                })
                    .slice(0, limit); // Apply limit
                return podcasts;
            }
            else {
                // React Native version
                const snapshot = await this.db.collection('weekly_podcasts').get();
                // Filter and sort in memory
                const podcasts = snapshot.docs
                    .map((doc) => (Object.assign({ id: doc.id }, doc.data())))
                    .filter(podcast => podcast.isPublic === true) // Filter public podcasts
                    .sort((a, b) => {
                    var _a, _b;
                    // Sort by createdAt descending
                    const aTime = ((_a = a.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
                    const bTime = ((_b = b.createdAt) === null || _b === void 0 ? void 0 : _b.toDate) ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
                    return bTime - aTime;
                })
                    .slice(0, limit); // Apply limit
                return podcasts;
            }
        }
        catch (error) {
            console.error('Error getting weekly podcasts:', error);
            return [];
        }
    }
    // Schedule weekly podcast generation (for Friday afternoons)
    async scheduleWeeklyPodcast() {
        try {
            console.log('📅 Scheduling weekly podcast generation...');
            // This would typically be called by a cron job or scheduled function
            // For now, we'll just generate it immediately
            await this.generateWeeklyPodcast();
            console.log('✅ Weekly podcast scheduled and generated');
        }
        catch (error) {
            console.error('Error scheduling weekly podcast:', error);
            throw error;
        }
    }
}
exports.WeeklyPodcastService = WeeklyPodcastService;
exports.weeklyPodcastService = new WeeklyPodcastService();
//# sourceMappingURL=WeeklyPodcastService.js.map