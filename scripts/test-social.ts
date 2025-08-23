import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const TEST_USERS = [
  {
    email: 'test1@example.com',
    password: 'testpass123',
    profile: {
      displayName: 'WildAce123',
      bio: 'Test user 1 - Public profile',
      isPublic: true,
    }
  },
  {
    email: 'test2@example.com',
    password: 'testpass123',
    profile: {
      displayName: 'RoyalSpade456',
      bio: 'Test user 2 - Private profile',
      isPublic: false,
    }
  },
  {
    email: 'test3@example.com',
    password: 'testpass123',
    profile: {
      displayName: 'GoldenHeart789',
      bio: 'Test user 3 - Public profile with followers',
      isPublic: true,
    }
  }
];

async function createTestUser(userData: typeof TEST_USERS[0]) {
  try {
    // Create Firebase Auth user
    const userCredential = await auth().createUserWithEmailAndPassword(
      userData.email,
      userData.password
    );

    // Create user profile in Firestore
    await firestore().collection('users').doc(userCredential.user.uid).set({
      ...userData.profile,
      email: userData.email,
      followersCount: 0,
      followingCount: 0,
      notificationsEnabled: true,
      emailNotifications: true,
    });

    console.log(`Created test user: ${userData.email}`);
    return userCredential.user;
  } catch (error) {
    console.error(`Error creating test user ${userData.email}:`, error);
    return null;
  }
}

async function setupTestFollowing(user1Id: string, user2Id: string) {
  try {
    // Add following relationship
    await firestore().collection('following').doc(user1Id).collection('users').doc(user2Id).set({
      timestamp: firestore.FieldValue.serverTimestamp(),
    });

    // Add followers relationship
    await firestore().collection('followers').doc(user2Id).collection('users').doc(user1Id).set({
      timestamp: firestore.FieldValue.serverTimestamp(),
    });

    // Update counts
    await firestore().collection('users').doc(user1Id).update({
      followingCount: firestore.FieldValue.increment(1),
    });

    await firestore().collection('users').doc(user2Id).update({
      followersCount: firestore.FieldValue.increment(1),
    });

    console.log(`Set up following relationship: ${user1Id} -> ${user2Id}`);
  } catch (error) {
    console.error('Error setting up following:', error);
  }
}

async function runTests() {
  try {
    console.log('Starting social feature tests...');

    // Create test users
    const users = await Promise.all(TEST_USERS.map(createTestUser));
    const validUsers = users.filter(user => user !== null);

    if (validUsers.length < 2) {
      throw new Error('Not enough valid users created to test following');
    }

    // Set up some following relationships
    await setupTestFollowing(validUsers[0].uid, validUsers[1].uid);
    await setupTestFollowing(validUsers[2].uid, validUsers[0].uid);

    console.log('\nTest users created successfully!');
    console.log('\nYou can now test the social features by:');
    console.log('1. Logging in with any of these test accounts:');
    TEST_USERS.forEach(user => {
      console.log(`   - Email: ${user.email} / Password: ${user.password}`);
    });
    console.log('\n2. Testing features:');
    console.log('   - Search for users by their display names');
    console.log('   - Try following/unfollowing users');
    console.log('   - Check followers/following lists');
    console.log('   - Test visibility differences between public/private profiles');

  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests(); 