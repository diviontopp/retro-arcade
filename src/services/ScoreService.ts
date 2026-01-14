import { db } from './firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, where } from 'firebase/firestore';

export class ScoreService {
    private static STORAGE_KEY = 'arcade_scores';

    static async saveScore(gameId: string, score: number, userId?: string, username?: string) {
        // 1. Save locally for immediate feedback
        const scores = this.getLocalScores();
        if (!scores[gameId] || score > scores[gameId]) {
            scores[gameId] = score;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scores));
        }

        // 2. Save to Firebase (if configured)
        try {
            await addDoc(collection(db, "scores"), {
                gameId,
                score,
                userId: userId || 'guest',
                username: username || 'Guest',
                timestamp: new Date()
            });
            return true;
        } catch (e) {
            console.error("Error adding document: ", e);
            return false;
        }
    }

    static getLocalScores(): Record<string, number> {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch {
            return {};
        }
    }

    static async getGlobalHighScores(gameId: string, limitCount = 10) {
        try {
            const q = query(
                collection(db, "scores"),
                where("gameId", "==", gameId),
                orderBy("score", "desc"),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data());
        } catch (e) {
            console.error("Error fetching scores: ", e);
            return [];
        }
    }
}
