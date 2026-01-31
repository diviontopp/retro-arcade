import { db } from './firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, where, onSnapshot } from 'firebase/firestore';

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

    static subscribeToHighScores(gameId: string, callback: (scores: any[]) => void, limitCount = 10) {
        try {
            const q = query(
                collection(db, "scores"),
                where("gameId", "==", gameId),
                orderBy("score", "desc"),
                limit(limitCount)
            );
            return onSnapshot(q, (snapshot) => {
                const scores = snapshot.docs.map(doc => doc.data());
                callback(scores);
            });
        } catch (e) {
            console.error("Error subscribing to scores: ", e);
            return () => { }; // return no-op unsubscribe
        }
    }

    // Get user's personal best scores from Firebase
    // Uses a simple query to avoid needing composite indexes
    static async getUserHighScores(userId: string): Promise<Record<string, number>> {
        const result: Record<string, number> = {};

        try {
            // Simple query - just filter by userId, process the rest client-side
            const q = query(
                collection(db, "scores"),
                where("userId", "==", userId)
            );
            const querySnapshot = await getDocs(q);

            // Process results to find highest score per game
            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                const gameId = data.gameId;
                const score = data.score || 0;

                if (!result[gameId] || score > result[gameId]) {
                    result[gameId] = score;
                }
            });

            return result;
        } catch (e) {
            console.error("Error fetching user scores: ", e);
            // Fall back to local scores on error
            return this.getLocalScores();
        }
    }
}
