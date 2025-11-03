// Initialize Firestore collections with sample data
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function initializeCollections() {
  console.log('🚀 Initializing Firestore collections...\n');

  try {
    // Create a sample post in the posts collection
    const postsRef = db.collection('posts');
    const samplePost = {
      authorId: 'system',
      authorName: 'Careerflow Team',
      authorProfilePicture: '',
      authorJobTitle: 'Platform Administrator',
      title: 'Welcome to Careerflow Posts!',
      content: 'Share your career insights, achievements, certifications, and work experience with the community. All posts are public and help you build your professional brand.',
      type: 'text',
      category: 'career_advice',
      tags: ['welcome', 'getting-started', 'careerflow'],
      visibility: 'public',
      likes: 0,
      likedBy: [],
      comments: 0,
      shares: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      featured: true,
    };

    await postsRef.add(samplePost);
    console.log('✅ Created posts collection with sample post');

    // Verify collection exists
    const snapshot = await postsRef.limit(1).get();
    console.log(`✅ Verified: ${snapshot.size} document(s) in posts collection\n`);

    console.log('🎉 Firestore initialization complete!');
    console.log('📝 You can now access /posts without permission errors\n');

  } catch (error) {
    console.error('❌ Error initializing Firestore:', error);
    process.exit(1);
  }

  process.exit(0);
}

initializeCollections();
