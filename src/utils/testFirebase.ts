/**
 * Firebase Integration Test Utility
 * Run this to verify Firebase Auth and Firestore are working correctly
 */

import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export class FirebaseTestUtility {

    /**
     * Test Firebase Authentication
     */
    static async testAuth(): Promise<boolean> {
        console.log('🔐 Testing Firebase Authentication...');

        try {
            // Test user credentials
            const testEmail = `test_${Date.now()}@arcade.local`;
            const testPassword = 'TestPass123!';

            console.log('  ✓ Creating test user...');
            const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
            console.log('  ✓ User created:', userCredential.user.uid);

            console.log('  ✓ Signing out...');
            await signOut(auth);
            console.log('  ✓ Signed out successfully');

            console.log('  ✓ Signing in...');
            const signInCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
            console.log('  ✓ Signed in:', signInCredential.user.uid);

            console.log('  ✓ Cleaning up (signing out)...');
            await signOut(auth);

            console.log('✅ Firebase Authentication: WORKING');
            return true;
        } catch (error: any) {
            console.error('❌ Firebase Authentication: FAILED');
            console.error('Error:', error.message);
            return false;
        }
    }

    /**
     * Test Firestore Database
     */
    static async testFirestore(): Promise<boolean> {
        console.log('💾 Testing Firestore Database...');

        try {
            // Test score data
            const testScore = {
                gameId: 'test',
                score: Math.floor(Math.random() * 1000),
                userId: 'test_user',
                username: 'TestPlayer',
                timestamp: new Date()
            };

            console.log('  ✓ Writing test score to Firestore...');
            const docRef = await addDoc(collection(db, 'scores'), testScore);
            console.log('  ✓ Document written with ID:', docRef.id);

            console.log('  ✓ Reading scores from Firestore...');
            const q = query(
                collection(db, 'scores'),
                where('gameId', '==', 'test'),
                orderBy('score', 'desc'),
                limit(5)
            );
            const querySnapshot = await getDocs(q);
            console.log('  ✓ Retrieved', querySnapshot.size, 'documents');

            querySnapshot.forEach((doc) => {
                console.log('    -', doc.data());
            });

            console.log('✅ Firestore Database: WORKING');
            return true;
        } catch (error: any) {
            console.error('❌ Firestore Database: FAILED');
            console.error('Error:', error.message);

            // Provide helpful error messages
            if (error.code === 'permission-denied') {
                console.error('⚠️  Firestore Security Rules may need to be deployed!');
                console.error('   Run: firebase deploy --only firestore:rules');
            } else if (error.code === 'failed-precondition') {
                console.error('⚠️  Firestore index may be missing!');
                console.error('   Check Firebase Console for index creation link');
            }

            return false;
        }
    }

    /**
     * Run all tests
     */
    static async runAllTests(): Promise<void> {
        console.log('🚀 Starting Firebase Integration Tests...\n');

        const authResult = await this.testAuth();
        console.log('\n');
        const firestoreResult = await this.testFirestore();

        console.log('\n' + '='.repeat(50));
        console.log('📊 Test Results:');
        console.log('  Authentication:', authResult ? '✅ PASS' : '❌ FAIL');
        console.log('  Firestore:', firestoreResult ? '✅ PASS' : '❌ FAIL');
        console.log('='.repeat(50));

        if (authResult && firestoreResult) {
            console.log('\n🎉 All Firebase services are working correctly!');
        } else {
            console.log('\n⚠️  Some Firebase services need attention.');
        }
    }
}

// Export a simple function to run from console
export const testFirebase = () => FirebaseTestUtility.runAllTests();

// Make it available globally for easy testing
if (typeof window !== 'undefined') {
    (window as any).testFirebase = testFirebase;
}
