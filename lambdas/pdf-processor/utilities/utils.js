const mongoose = require("mongoose");

// ✅ Add connection monitoring at module level (runs once per container)

let monitoringInitialized = false;

const initializeConnectionMonitoring = () => {
    if (monitoringInitialized) return;
    
    mongoose.connection.on('connected', () => {
        console.log('***MongoDB connection established***');
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('***MongoDB connection lost***');
    });

    mongoose.connection.on('error', (err) => {
        console.error('***MongoDB connection error***:', err);
    });

    mongoose.connection.on('reconnected', () => {
        console.log('***MongoDB reconnected***');
    });

    monitoringInitialized = true;
};


const setDBConnection = async (mongoUri) => {

    // readyState values:
    // 0 = disconnected
    // 1 = connected
    // 2 = connecting
    // 3 = disconnecting
    const disconnected = 0;

    // to make sure we use only one db connection across different lambda invocations
    if (mongoose.connection.readyState === disconnected) {
        await mongoose.connect(mongoUri);
    }

    // Initialize monitoring once
    initializeConnectionMonitoring();

};


/**
 * Extracts MongoDB document ID from S3 filename
 * @param {string} filename - S3 object key or filename
 * @returns {string|null} - Document ID or null if not found
 * fileName example: Mahmoud_Farag_Dainin_Assessment_697525717c77a421dcc85797_1769284977548.pdf
 */
function extractDocumentIdFromFilename(filename) {

    if(!filename)
        return null;

  const basename = filename.split('/').pop();
  
  // omit the .pdf extension
  const nameWithoutExt = basename.replace('.pdf', '');
  
  const parts = nameWithoutExt.split('_');
  
  // MongoDB ObjectId is 24 characters (hex string)
  // Find the part that matches this pattern
  const documentId = parts.find(part => /^[a-f0-9]{24}$/i.test(part));
  
  return documentId || null;
}




module.exports = { setDBConnection, extractDocumentIdFromFilename };