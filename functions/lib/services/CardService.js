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
exports.cardService = exports.CardService = void 0;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
class CardService {
    // Generate card from podcast data
    async generateCardFromPodcast(podcastData) {
        const card = {
            id: `podcast_${podcastData.id}`,
            type: 'podcast',
            title: podcastData.title,
            description: podcastData.description,
            contentUrl: podcastData.audioUrl,
            imageUrl: podcastData.thumbnailUrl,
            metadata: {
                weekNumber: podcastData.weekNumber,
            },
            createdAt: admin.firestore.Timestamp.now(),
            priority: this.calculatePodcastPriority(podcastData),
            tags: podcastData.tags || ['podcast', 'community'],
            engagement: {
                views: 0,
                saves: 0,
                shares: 0,
            },
        };
        // Save to Firestore
        await db.collection('cards').doc(card.id).set(card);
        return card;
    }
    // Calculate priority for podcast cards
    calculatePodcastPriority(podcastData) {
        let priority = 40;
        const weekNumber = parseInt(podcastData.weekNumber);
        if (!isNaN(weekNumber)) {
            priority += Math.min(20, weekNumber);
        }
        return Math.min(100, priority);
    }
    // Check for duplicate cards
    async checkForDuplicateCard(contentId, type) {
        try {
            const snapshot = await db
                .collection('cards')
                .where('id', '==', `${type}_${contentId}`)
                .limit(1)
                .get();
            return !snapshot.empty;
        }
        catch (error) {
            console.error('Error checking for duplicate card:', error);
            return false;
        }
    }
}
exports.CardService = CardService;
exports.cardService = new CardService();
//# sourceMappingURL=CardService.js.map