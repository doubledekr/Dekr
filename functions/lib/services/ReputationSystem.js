"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reputationSystem = void 0;
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("./firebase");
const analytics_1 = require("./analytics");
class ReputationSystem {
    constructor() {
        this.reputationCollection = (0, firestore_1.collection)(firebase_1.db, 'user_reputation');
        this.eventsCollection = (0, firestore_1.collection)(firebase_1.db, 'reputation_events');
        this.leaderboardCollection = (0, firestore_1.collection)(firebase_1.db, 'leaderboard');
    }
    // Calculate reputation score based on various factors
    calculateReputationScore(totalRecommendations, approvedRecommendations, totalVotes, helpfulVotes, followers) {
        // Base score from recommendations
        const recommendationScore = approvedRecommendations * 5;
        // Accuracy bonus (higher accuracy = more points)
        const accuracyRate = totalRecommendations > 0 ? approvedRecommendations / totalRecommendations : 0;
        const accuracyBonus = accuracyRate * 20;
        // Community engagement bonus
        const engagementScore = totalVotes * 0.5;
        const helpfulnessBonus = helpfulVotes * 2;
        // Follower bonus
        const followerBonus = followers * 0.1;
        // Calculate total score
        const totalScore = recommendationScore + accuracyBonus + engagementScore + helpfulnessBonus + followerBonus;
        // Cap at 1000 points
        return Math.min(totalScore, 1000);
    }
    // Calculate reputation level based on score
    calculateReputationLevel(score) {
        if (score >= 800)
            return 'master';
        if (score >= 500)
            return 'expert';
        if (score >= 200)
            return 'intermediate';
        return 'novice';
    }
    // Calculate badges based on achievements
    calculateBadges(reputation) {
        const badges = [];
        // Recommendation badges
        if (reputation.totalRecommendations >= 10)
            badges.push('contributor');
        if (reputation.totalRecommendations >= 50)
            badges.push('veteran');
        if (reputation.totalRecommendations >= 100)
            badges.push('legend');
        // Accuracy badges
        if (reputation.accuracyRate >= 0.7)
            badges.push('accurate');
        if (reputation.accuracyRate >= 0.8)
            badges.push('expert_analyst');
        if (reputation.accuracyRate >= 0.9)
            badges.push('market_guru');
        // Community badges
        if (reputation.allTimeStats.totalVotes >= 100)
            badges.push('community_voice');
        if (reputation.allTimeStats.helpfulVotes >= 50)
            badges.push('helpful_member');
        if (reputation.allTimeStats.followers >= 25)
            badges.push('influencer');
        // Special badges
        if (reputation.level === 'master')
            badges.push('master_trader');
        if (reputation.weeklyPerformance.accuracy >= 0.9)
            badges.push('weekly_star');
        if (reputation.monthlyPerformance.accuracy >= 0.85)
            badges.push('monthly_champion');
        return badges;
    }
    // Calculate achievements based on milestones
    calculateAchievements(reputation) {
        const achievements = [];
        // First recommendation
        if (reputation.totalRecommendations >= 1)
            achievements.push('first_recommendation');
        // First approval
        if (reputation.approvedRecommendations >= 1)
            achievements.push('first_approval');
        // Streak achievements
        if (reputation.weeklyPerformance.recommendations >= 5)
            achievements.push('active_contributor');
        if (reputation.monthlyPerformance.recommendations >= 20)
            achievements.push('monthly_contributor');
        // Accuracy achievements
        if (reputation.accuracyRate >= 0.5 && reputation.totalRecommendations >= 10)
            achievements.push('reliable_analyst');
        if (reputation.accuracyRate >= 0.7 && reputation.totalRecommendations >= 25)
            achievements.push('trusted_advisor');
        // Community achievements
        if (reputation.allTimeStats.totalVotes >= 50)
            achievements.push('community_participant');
        if (reputation.allTimeStats.helpfulVotes >= 25)
            achievements.push('helpful_contributor');
        return achievements;
    }
    // Get or create user reputation
    async getUserReputation(userId) {
        try {
            const q = (0, firestore_1.query)(this.reputationCollection, (0, firestore_1.where)('userId', '==', userId));
            const snapshot = await (0, firestore_1.getDocs)(q);
            if (snapshot.empty)
                return null;
            const doc = snapshot.docs[0];
            return Object.assign({ id: doc.id }, doc.data());
        }
        catch (error) {
            console.error('Error getting user reputation:', error);
            throw error;
        }
    }
    // Create new user reputation
    async createUserReputation(userId, userName, userAvatar) {
        try {
            const newReputation = {
                userId,
                userName,
                userAvatar,
                totalRecommendations: 0,
                approvedRecommendations: 0,
                rejectedRecommendations: 0,
                accuracyRate: 0,
                reputationScore: 0,
                level: 'novice',
                badges: [],
                achievements: [],
                weeklyPerformance: {
                    recommendations: 0,
                    accuracy: 0,
                    votes: 0,
                },
                monthlyPerformance: {
                    recommendations: 0,
                    accuracy: 0,
                    votes: 0,
                },
                allTimeStats: {
                    totalVotes: 0,
                    helpfulVotes: 0,
                    totalViews: 0,
                    followers: 0,
                },
                lastUpdated: (0, firestore_1.serverTimestamp)(),
                createdAt: (0, firestore_1.serverTimestamp)(),
            };
            const docRef = await (0, firestore_1.addDoc)(this.reputationCollection, newReputation);
            (0, analytics_1.logEvent)(analytics_1.AnalyticsEvents.CREATE_REPUTATION, {
                user_id: userId,
                reputation_id: docRef.id,
            });
            return Object.assign({ id: docRef.id }, newReputation);
        }
        catch (error) {
            console.error('Error creating user reputation:', error);
            throw error;
        }
    }
    // Update reputation after recommendation outcome
    async updateReputationAfterRecommendation(userId, wasApproved, performanceScore) {
        try {
            let reputation = await this.getUserReputation(userId);
            if (!reputation) {
                // Create new reputation if it doesn't exist
                reputation = await this.createUserReputation(userId, 'Unknown User');
            }
            // Update recommendation counts
            const newTotal = reputation.totalRecommendations + 1;
            const newApproved = reputation.approvedRecommendations + (wasApproved ? 1 : 0);
            const newRejected = reputation.rejectedRecommendations + (wasApproved ? 0 : 1);
            const newAccuracyRate = newApproved / newTotal;
            // Calculate new reputation score
            const newReputationScore = this.calculateReputationScore(newTotal, newApproved, reputation.allTimeStats.totalVotes, reputation.allTimeStats.helpfulVotes, reputation.allTimeStats.followers);
            const newLevel = this.calculateReputationLevel(newReputationScore);
            // Update reputation
            const docRef = (0, firestore_1.doc)(this.reputationCollection, reputation.id);
            await (0, firestore_1.updateDoc)(docRef, {
                totalRecommendations: newTotal,
                approvedRecommendations: newApproved,
                rejectedRecommendations: newRejected,
                accuracyRate: newAccuracyRate,
                reputationScore: newReputationScore,
                level: newLevel,
                lastUpdated: (0, firestore_1.serverTimestamp)(),
            });
            // Check for level up
            if (newLevel !== reputation.level) {
                await this.recordReputationEvent(userId, 'level_up', 50, `Leveled up to ${newLevel}!`);
            }
            // Check for new badges and achievements
            const updatedReputation = await this.getUserReputation(userId);
            if (updatedReputation) {
                const newBadges = this.calculateBadges(updatedReputation);
                const newAchievements = this.calculateAchievements(updatedReputation);
                const badgeDiff = newBadges.filter(badge => !reputation.badges.includes(badge));
                const achievementDiff = newAchievements.filter(achievement => !reputation.achievements.includes(achievement));
                if (badgeDiff.length > 0 || achievementDiff.length > 0) {
                    await (0, firestore_1.updateDoc)(docRef, {
                        badges: newBadges,
                        achievements: newAchievements,
                    });
                    // Record badge/achievement events
                    for (const badge of badgeDiff) {
                        await this.recordReputationEvent(userId, 'achievement_unlocked', 25, `Earned badge: ${badge}`);
                    }
                    for (const achievement of achievementDiff) {
                        await this.recordReputationEvent(userId, 'achievement_unlocked', 15, `Unlocked achievement: ${achievement}`);
                    }
                }
            }
            // Record the recommendation event
            await this.recordReputationEvent(userId, wasApproved ? 'recommendation_approved' : 'recommendation_rejected', wasApproved ? 10 : -2, wasApproved ? 'Recommendation approved by community' : 'Recommendation rejected by community');
        }
        catch (error) {
            console.error('Error updating reputation after recommendation:', error);
            throw error;
        }
    }
    // Update reputation after receiving votes
    async updateReputationAfterVote(userId, wasHelpful) {
        try {
            const reputation = await this.getUserReputation(userId);
            if (!reputation)
                return;
            const newTotalVotes = reputation.allTimeStats.totalVotes + 1;
            const newHelpfulVotes = reputation.allTimeStats.helpfulVotes + (wasHelpful ? 1 : 0);
            // Recalculate reputation score
            const newReputationScore = this.calculateReputationScore(reputation.totalRecommendations, reputation.approvedRecommendations, newTotalVotes, newHelpfulVotes, reputation.allTimeStats.followers);
            const docRef = (0, firestore_1.doc)(this.reputationCollection, reputation.id);
            await (0, firestore_1.updateDoc)(docRef, {
                'allTimeStats.totalVotes': newTotalVotes,
                'allTimeStats.helpfulVotes': newHelpfulVotes,
                reputationScore: newReputationScore,
                lastUpdated: (0, firestore_1.serverTimestamp)(),
            });
            // Record vote event
            await this.recordReputationEvent(userId, 'vote_received', wasHelpful ? 2 : 0, wasHelpful ? 'Received helpful vote' : 'Received vote');
        }
        catch (error) {
            console.error('Error updating reputation after vote:', error);
            throw error;
        }
    }
    // Record a reputation event
    async recordReputationEvent(userId, eventType, points, description, metadata) {
        try {
            const event = {
                userId,
                eventType,
                points,
                description,
                metadata,
                timestamp: (0, firestore_1.serverTimestamp)(),
            };
            await (0, firestore_1.addDoc)(this.eventsCollection, event);
            (0, analytics_1.logEvent)(analytics_1.AnalyticsEvents.REPUTATION_EVENT, {
                user_id: userId,
                event_type: eventType,
                points,
            });
        }
        catch (error) {
            console.error('Error recording reputation event:', error);
        }
    }
    // Get user's reputation events
    async getUserReputationEvents(userId, limitCount = 20) {
        try {
            const q = (0, firestore_1.query)(this.eventsCollection, (0, firestore_1.where)('userId', '==', userId), (0, firestore_1.orderBy)('timestamp', 'desc'), (0, firestore_1.limit)(limitCount));
            const snapshot = await (0, firestore_1.getDocs)(q);
            return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        }
        catch (error) {
            console.error('Error getting user reputation events:', error);
            throw error;
        }
    }
    // Get leaderboard
    async getLeaderboard(limitCount = 50) {
        try {
            const q = (0, firestore_1.query)(this.reputationCollection, (0, firestore_1.orderBy)('reputationScore', 'desc'), (0, firestore_1.limit)(limitCount));
            const snapshot = await (0, firestore_1.getDocs)(q);
            return snapshot.docs.map((doc, index) => {
                const data = doc.data();
                return {
                    userId: data.userId,
                    userName: data.userName,
                    userAvatar: data.userAvatar,
                    reputationScore: data.reputationScore,
                    level: data.level,
                    badges: data.badges,
                    rank: index + 1,
                };
            });
        }
        catch (error) {
            console.error('Error getting leaderboard:', error);
            throw error;
        }
    }
    // Get top performers by category
    async getTopPerformers(category) {
        try {
            let orderField;
            switch (category) {
                case 'accuracy':
                    orderField = 'accuracyRate';
                    break;
                case 'recommendations':
                    orderField = 'totalRecommendations';
                    break;
                case 'votes':
                    orderField = 'allTimeStats.totalVotes';
                    break;
                default:
                    orderField = 'reputationScore';
            }
            const q = (0, firestore_1.query)(this.reputationCollection, (0, firestore_1.orderBy)(orderField, 'desc'), (0, firestore_1.limit)(20));
            const snapshot = await (0, firestore_1.getDocs)(q);
            return snapshot.docs.map((doc, index) => {
                const data = doc.data();
                return {
                    userId: data.userId,
                    userName: data.userName,
                    userAvatar: data.userAvatar,
                    reputationScore: data.reputationScore,
                    level: data.level,
                    badges: data.badges,
                    rank: index + 1,
                };
            });
        }
        catch (error) {
            console.error('Error getting top performers:', error);
            throw error;
        }
    }
    // Update weekly/monthly performance
    async updatePerformanceStats(userId) {
        try {
            const reputation = await this.getUserReputation(userId);
            if (!reputation)
                return;
            // This would typically be called by a scheduled function
            // For now, we'll just update the lastUpdated timestamp
            const docRef = (0, firestore_1.doc)(this.reputationCollection, reputation.id);
            await (0, firestore_1.updateDoc)(docRef, {
                lastUpdated: (0, firestore_1.serverTimestamp)(),
            });
        }
        catch (error) {
            console.error('Error updating performance stats:', error);
        }
    }
}
exports.reputationSystem = new ReputationSystem();
//# sourceMappingURL=ReputationSystem.js.map