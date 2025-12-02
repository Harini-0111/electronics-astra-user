const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');

// MongoDB Atlas connection URI - add to .env file
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGO_DB_NAME || 'electronics_astra';

let db = null;
let gridFSBucket = null;
let client = null;

/**
 * Connect to MongoDB Atlas
 */
async function connectMongoDB() {
  try {
    if (db) {
      console.log('MongoDB already connected');
      return { db, gridFSBucket };
    }

    client = new MongoClient(MONGO_URI);

    await client.connect();
    db = client.db(DB_NAME);
    
    // Initialize GridFS bucket
    gridFSBucket = new GridFSBucket(db, {
      bucketName: 'library_files'
    });

    console.log('✅ MongoDB Atlas connected successfully');
    console.log(`✅ GridFS bucket initialized: library_files`);
    
    // Create indexes for collections
    await createIndexes();
    
    return { db, gridFSBucket };
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Create indexes for MongoDB collections
 */
async function createIndexes() {
  try {
    // Index for libraryFiles collection
    await db.collection('libraryFiles').createIndex({ ownerPostgresId: 1 });
    await db.collection('libraryFiles').createIndex({ ownerUserid: 1 });
    await db.collection('libraryFiles').createIndex({ uploadedAt: -1 });
    
    // Index for fileShares collection
    await db.collection('fileShares').createIndex({ fileId: 1 });
    await db.collection('fileShares').createIndex({ sharedWithUserId: 1 });
    await db.collection('fileShares').createIndex({ sharedByUserId: 1 });
    
    console.log('✅ MongoDB indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating MongoDB indexes:', error);
  }
}

/**
 * Get MongoDB database instance
 */
function getDB() {
  if (!db) {
    throw new Error('MongoDB not connected. Call connectMongoDB() first.');
  }
  return db;
}

/**
 * Get GridFS bucket instance
 */
function getGridFSBucket() {
  if (!gridFSBucket) {
    throw new Error('GridFS bucket not initialized. Call connectMongoDB() first.');
  }
  return gridFSBucket;
}

/**
 * Close MongoDB connection
 */
async function closeMongoDB() {
  if (client) {
    await client.close();
    db = null;
    gridFSBucket = null;
    client = null;
    console.log('MongoDB connection closed');
  }
}

/**
 * Upload file to GridFS
 * @param {Buffer} fileBuffer - File buffer
 * @param {Object} metadata - File metadata
 * @returns {Promise<ObjectId>} - GridFS file ID
 */
async function uploadToGridFS(fileBuffer, metadata) {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket();
    const uploadStream = bucket.openUploadStream(metadata.filename, {
      metadata: {
        originalName: metadata.originalName,
        fileType: metadata.fileType,
        ownerPostgresId: metadata.ownerPostgresId,
        ownerUserid: metadata.ownerUserid,
      }
    });

    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      resolve(uploadStream.id);
    });

    uploadStream.end(fileBuffer);
  });
}

/**
 * Download file from GridFS
 * @param {string} fileId - GridFS file ID
 * @returns {ReadableStream} - File stream
 */
function downloadFromGridFS(fileId) {
  const bucket = getGridFSBucket();
  return bucket.openDownloadStream(new ObjectId(fileId));
}

/**
 * Delete file from GridFS
 * @param {string} fileId - GridFS file ID
 */
async function deleteFromGridFS(fileId) {
  const bucket = getGridFSBucket();
  await bucket.delete(new ObjectId(fileId));
}

/**
 * Get file info from GridFS
 * @param {string} fileId - GridFS file ID
 */
async function getGridFSFileInfo(fileId) {
  const bucket = getGridFSBucket();
  const files = await bucket.find({ _id: new ObjectId(fileId) }).toArray();
  return files[0] || null;
}

module.exports = {
  connectMongoDB,
  closeMongoDB,
  getDB,
  getGridFSBucket,
  uploadToGridFS,
  downloadFromGridFS,
  deleteFromGridFS,
  getGridFSFileInfo,
  ObjectId
};
