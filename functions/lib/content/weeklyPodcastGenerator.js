"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWeeklyPodcast = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const db = (0, firestore_1.getFirestore)();
// Weekly podcast generation - runs every Friday at 4 PM EST
exports.generateWeeklyPodcast = (0, scheduler_1.onSchedule)({
    schedule: '0 16 * * 5',
    timeZone: 'America/New_York',
    memory: '1GiB',
    timeoutSeconds: 540, // 9 minutes
}, async (event) => {
    try {
        firebase_functions_1.logger.info('🎙️ Starting weekly podcast generation...');
        // Import the service (dynamic import for Firebase Functions)
        const { weeklyPodcastService } = await Promise.resolve().then(() => __importStar(require('../../services/WeeklyPodcastService')));
        // Check if podcast already exists for this week
        const { weekOf } = getCurrentWeek();
        const existingPodcast = await weeklyPodcastService.getExistingWeeklyPodcast(weekOf);
        if (existingPodcast) {
            firebase_functions_1.logger.info(`✅ Weekly podcast already exists for week: ${weekOf}`);
            return;
        }
        // Generate new weekly podcast
        firebase_functions_1.logger.info('🚀 Generating new weekly community podcast...');
        const podcast = await weeklyPodcastService.generateWeeklyPodcast();
        // Create card for the podcast (for discovery feed)
        const { cardService } = await Promise.resolve().then(() => __importStar(require('../../services/CardService')));
        await cardService.generateCardFromPodcast({
            id: podcast.id,
            title: podcast.title,
            description: podcast.description,
            audioUrl: podcast.audioUrl,
            weekNumber: podcast.weekOf,
            segments: podcast.content.segments,
            thumbnailUrl: podcast.thumbnailUrl,
            tags: ['weekly', 'community', 'podcast', 'market-update']
        });
        firebase_functions_1.logger.info('✅ Weekly podcast generated and card created successfully!');
        firebase_functions_1.logger.info(`Podcast ID: ${podcast.id}, Week: ${podcast.weekOf}`);
    }
    catch (error) {
        firebase_functions_1.logger.error('❌ Error generating weekly podcast:', error);
        throw error;
    }
});
// Helper function to get current week identifier
function getCurrentWeek() {
    const now = new Date();
    const year = now.getFullYear();
    const weekNumber = getWeekNumber(now);
    return { weekOf: `${year}-W${weekNumber.toString().padStart(2, '0')}` };
}
function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
//# sourceMappingURL=weeklyPodcastGenerator.js.map