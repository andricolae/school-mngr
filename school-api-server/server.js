// // server.js
// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const https = require('https');
// const path = require('path');
// const { sign } = require('jsonwebtoken');

// // Create Express app
// const app = express();

// // Set up middleware
// app.use(cors());
// app.use(bodyParser.json());
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
//   next();
// });

// // Firebase connection state
// let firebaseConnected = false;
// let projectId = process.env.FIREBASE_PROJECT_ID || 'not connected';

// // Simple Firebase REST API implementation for Vercel environment
// const firebase = {
//   token: null,
//   tokenExpiry: 0,

//   // Generate a new Firebase auth token
//   async getAuthToken() {
//     if (this.token && this.tokenExpiry > Date.now()) {
//       return this.token;
//     }

//     try {
//       // Create a JWT token for authentication with Firebase
//       const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
//       const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

//       // Token expiration (1 hour from now)
//       const expiryTime = Math.floor(Date.now() / 1000) + 3600;

//       // Create the JWT token
//       const token = sign({
//         iss: clientEmail,
//         sub: clientEmail,
//         aud: 'https://firestore.googleapis.com/google.firestore.v1.Firestore',
//         iat: Math.floor(Date.now() / 1000),
//         exp: expiryTime,
//       }, privateKey, { algorithm: 'RS256' });

//       this.token = token;
//       this.tokenExpiry = expiryTime * 1000; // Convert to milliseconds
//       return token;
//     } catch (error) {
//       console.error('Error generating Firebase auth token:', error);
//       throw error;
//     }
//   },

//   // Make a request to the Firebase REST API
//   async makeRequest(method, path, data = null) {
//     try {
//       const token = await this.getAuthToken();
//       const projectId = process.env.FIREBASE_PROJECT_ID;

//       return new Promise((resolve, reject) => {
//         const options = {
//           hostname: 'firestore.googleapis.com',
//           path: `/v1/projects/${projectId}/databases/(default)/documents${path}`,
//           method: method,
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           }
//         };

//         const req = https.request(options, (res) => {
//           let responseData = '';

//           res.on('data', (chunk) => {
//             responseData += chunk;
//           });

//           res.on('end', () => {
//             if (res.statusCode >= 200 && res.statusCode < 300) {
//               try {
//                 const parsedData = JSON.parse(responseData);
//                 resolve(parsedData);
//               } catch (e) {
//                 resolve(responseData);
//               }
//             } else {
//               reject(new Error(`HTTP Error ${res.statusCode}: ${responseData}`));
//             }
//           });
//         });

//         req.on('error', (error) => {
//           reject(error);
//         });

//         if (data) {
//           req.write(JSON.stringify(data));
//         }

//         req.end();
//       });
//     } catch (error) {
//       console.error('Firebase API request failed:', error);
//       throw error;
//     }
//   },

//   // Create a document in a collection
//   async addDocument(collection, data) {
//     try {
//       // Convert JavaScript object to Firestore document
//       const firestoreData = {
//         fields: this._objectToFirestore(data)
//       };

//       const response = await this.makeRequest('POST', `/${collection}`, firestoreData);

//       // Extract the document ID from the name field
//       const nameParts = response.name.split('/');
//       const docId = nameParts[nameParts.length - 1];

//       return {
//         id: docId,
//         ...data
//       };
//     } catch (error) {
//       console.error(`Error adding document to ${collection}:`, error);
//       throw error;
//     }
//   },

//   // Get a document by ID
//   async getDocument(collection, docId) {
//     try {
//       const response = await this.makeRequest('GET', `/${collection}/${docId}`);
//       return {
//         id: docId,
//         ...this._firestoreToObject(response.fields)
//       };
//     } catch (error) {
//       console.error(`Error getting document ${docId} from ${collection}:`, error);
//       throw error;
//     }
//   },

//   // Set a document with a known ID
//   async setDocument(collection, docId, data) {
//     try {
//       const firestoreData = {
//         fields: this._objectToFirestore(data)
//       };

//       await this.makeRequest('PATCH', `/${collection}/${docId}`, firestoreData);

//       return {
//         id: docId,
//         ...data
//       };
//     } catch (error) {
//       console.error(`Error setting document ${docId} in ${collection}:`, error);
//       throw error;
//     }
//   },

//   // Update specific fields in a document
//   async updateDocument(collection, docId, data) {
//     try {
//       // Get current document
//       const currentDoc = await this.getDocument(collection, docId);

//       // Merge with new data
//       const updatedDoc = {
//         ...currentDoc,
//         ...data,
//         id: currentDoc.id // Ensure ID isn't overwritten
//       };

//       // Set the merged document
//       return await this.setDocument(collection, docId, updatedDoc);
//     } catch (error) {
//       console.error(`Error updating document ${docId} in ${collection}:`, error);
//       throw error;
//     }
//   },

//   // Delete a document
//   async deleteDocument(collection, docId) {
//     try {
//       await this.makeRequest('DELETE', `/${collection}/${docId}`);
//       return true;
//     } catch (error) {
//       console.error(`Error deleting document ${docId} from ${collection}:`, error);
//       throw error;
//     }
//   },

//   // Helper to convert JavaScript objects to Firestore format
//   _objectToFirestore(obj) {
//     const result = {};

//     for (const [key, value] of Object.entries(obj)) {
//       if (value === null || value === undefined) {
//         result[key] = { nullValue: null };
//       } else if (typeof value === 'string') {
//         result[key] = { stringValue: value };
//       } else if (typeof value === 'number') {
//         result[key] = { doubleValue: value };
//       } else if (typeof value === 'boolean') {
//         result[key] = { booleanValue: value };
//       } else if (value instanceof Date) {
//         result[key] = { timestampValue: value.toISOString() };
//       } else if (Array.isArray(value)) {
//         result[key] = {
//           arrayValue: {
//             values: value.map(item => this._objectToFirestore({ item }).item)
//           }
//         };
//       } else if (typeof value === 'object') {
//         result[key] = {
//           mapValue: {
//             fields: this._objectToFirestore(value)
//           }
//         };
//       }
//     }

//     return result;
//   },

//   // Helper to convert Firestore format back to JavaScript objects
//   _firestoreToObject(firestoreObj) {
//     const result = {};

//     for (const [key, value] of Object.entries(firestoreObj)) {
//       if (value.nullValue !== undefined) {
//         result[key] = null;
//       } else if (value.stringValue !== undefined) {
//         result[key] = value.stringValue;
//       } else if (value.doubleValue !== undefined) {
//         result[key] = value.doubleValue;
//       } else if (value.integerValue !== undefined) {
//         result[key] = parseInt(value.integerValue, 10);
//       } else if (value.booleanValue !== undefined) {
//         result[key] = value.booleanValue;
//       } else if (value.timestampValue !== undefined) {
//         result[key] = new Date(value.timestampValue);
//       } else if (value.arrayValue !== undefined) {
//         result[key] = value.arrayValue.values
//           ? value.arrayValue.values.map(item => this._firestoreToObject({ item }).item)
//           : [];
//       } else if (value.mapValue !== undefined) {
//         result[key] = this._firestoreToObject(value.mapValue.fields || {});
//       }
//     }

//     return result;
//   },

//   // Test function to verify connection
//   async testConnection() {
//     try {
//       const testData = {
//         message: 'Test connection',
//         timestamp: new Date().toISOString()
//       };

//       // Create test document
//       const docData = await this.addDocument('test', testData);
//       console.log('Test document created:', docData.id);

//       // Get the document
//       const retrievedDoc = await this.getDocument('test', docData.id);
//       console.log('Test document retrieved');

//       // Delete the document
//       await this.deleteDocument('test', docData.id);
//       console.log('Test document deleted');

//       firebaseConnected = true;
//       return true;
//     } catch (error) {
//       console.error('Firebase connection test failed:', error);
//       firebaseConnected = false;
//       return false;
//     }
//   }
// };

// // Check Firebase connection at startup
// (async () => {
//   try {
//     if (process.env.FIREBASE_PROJECT_ID &&
//         process.env.FIREBASE_CLIENT_EMAIL &&
//         process.env.FIREBASE_PRIVATE_KEY) {
//       console.log('Testing Firebase connection...');
//       await firebase.testConnection();
//       console.log('Firebase connection test result:', firebaseConnected);
//     } else {
//       console.log('Firebase environment variables missing, skipping connection test');
//     }
//   } catch (error) {
//     console.error('Firebase initialization error:', error);
//   }
// })();

// // Home page route
// app.get('/', (req, res) => {
//   res.send(`
//     <html>
//       <head>
//         <title>School Manager API</title>
//         <style>
//           body {
//             font-family: Arial, sans-serif;
//             max-width: 800px;
//             margin: 0 auto;
//             padding: 20px;
//             line-height: 1.6;
//           }
//           h1 { color: #3490dc; }
//           h2 { color: #2779bd; margin-top: 30px; }
//           code {
//             background: #f8f9fa;
//             padding: 2px 5px;
//             border-radius: 3px;
//           }
//           .endpoint {
//             background: #f1f5f8;
//             border-left: 4px solid #3490dc;
//             padding: 10px 15px;
//             margin: 10px 0;
//           }
//         </style>
//       </head>
//       <body>
//         <h1>School Manager API Server</h1>
//         <p>The API server is running correctly. Below are some test endpoints you can use to verify functionality:</p>

//         <h2>Test Endpoints</h2>
//         <div class="endpoint">
//           <code>GET /api/health</code> - Health check endpoint
//         </div>
//         <div class="endpoint">
//           <code>GET /api/info</code> - Server information
//         </div>
//         <div class="endpoint">
//           <code>GET /api/firebase-debug</code> - Firebase connection debug info
//         </div>
//         <div class="endpoint">
//           <code>GET /api/create-test-notification</code> - Create a test notification
//         </div>
//       </body>
//     </html>
//   `);
// });

// // Health check endpoint
// app.get('/api/health', (req, res) => {
//   res.status(200).json({
//     status: 'UP',
//     timestamp: new Date(),
//     uptime: process.uptime()
//   });
// });

// // Server info endpoint
// app.get('/api/info', async (req, res) => {
//   let testFirebaseConnected = false;

//   try {
//     testFirebaseConnected = await firebase.testConnection();
//   } catch (error) {
//     console.error('Firebase connection check failed:', error);
//   }

//   res.status(200).json({
//     serverName: 'School Manager API',
//     version: '1.0.0',
//     nodeVersion: process.version,
//     environment: process.env.NODE_ENV || 'development',
//     firebase: {
//       connected: testFirebaseConnected,
//       initializedStatus: firebaseConnected,
//       projectId: projectId,
//       implementation: 'REST API' // Using REST API instead of Admin SDK
//     },
//     endpoints: {
//       health: '/api/health',
//       info: '/api/info',
//       notifications: '/api/notifications',
//       courseSchedule: '/api/courses/:courseId/schedule',
//       courseSessions: '/api/courses/:courseId/sessions'
//     }
//   });
// });

// // Firebase debug endpoint
// app.get('/api/firebase-debug', (req, res) => {
//   const envVars = {
//     projectIdExists: !!process.env.FIREBASE_PROJECT_ID,
//     clientEmailExists: !!process.env.FIREBASE_CLIENT_EMAIL,
//     privateKeyExists: !!process.env.FIREBASE_PRIVATE_KEY,
//     projectId: process.env.FIREBASE_PROJECT_ID || 'not available',
//     clientEmailPrefix: process.env.FIREBASE_CLIENT_EMAIL ?
//       process.env.FIREBASE_CLIENT_EMAIL.substring(0, 10) + '...' : 'not available',
//     privateKeyLength: process.env.FIREBASE_PRIVATE_KEY ?
//       process.env.FIREBASE_PRIVATE_KEY.length : 'not available',
//     nodeEnv: process.env.NODE_ENV || 'not set',
//     vercelEnv: process.env.VERCEL_ENV || 'not in vercel'
//   };

//   res.status(200).json({
//     firebaseInitialized: firebaseConnected,
//     implementation: 'REST API',
//     environmentVariables: envVars,
//     timestamp: new Date()
//   });
// });

// // Test Firebase connection
// app.get('/api/firebase-test', async (req, res) => {
//   try {
//     console.log('Testing Firebase connection with REST API...');

//     const results = {
//       implementation: 'REST API',
//       connected: firebaseConnected,
//       tests: {
//         write: { attempted: false, success: false, error: null },
//         read: { attempted: false, success: false, error: null },
//         delete: { attempted: false, success: false, error: null }
//       },
//       timeStamp: new Date().toISOString()
//     };

//     try {
//       // Test document write
//       results.tests.write.attempted = true;
//       const testDoc = {
//         message: 'Test document',
//         timestamp: new Date().toISOString()
//       };
//       const docData = await firebase.addDocument('debug_tests', testDoc);
//       results.tests.write.success = true;

//       // Test document read
//       results.tests.read.attempted = true;
//       const retrievedDoc = await firebase.getDocument('debug_tests', docData.id);
//       results.tests.read.success = true;

//       // Test document delete
//       results.tests.delete.attempted = true;
//       await firebase.deleteDocument('debug_tests', docData.id);
//       results.tests.delete.success = true;
//     } catch (error) {
//       console.error('Firebase test operations failed:', error);
//       if (!results.tests.write.success) {
//         results.tests.write.error = error.message;
//       } else if (!results.tests.read.success) {
//         results.tests.read.error = error.message;
//       } else if (!results.tests.delete.success) {
//         results.tests.delete.error = error.message;
//       }
//     }

//     res.status(200).json(results);
//   } catch (error) {
//     res.status(500).json({
//       error: 'Firebase test failed',
//       message: error.message
//     });
//   }
// });

// // Create test notification endpoint
// app.get('/api/create-test-notification', async (req, res) => {
//   try {
//     console.log('Starting test notification creation with REST API...');

//     const notification = {
//       courseId: 'test-course-123',
//       courseName: 'Test Course',
//       type: 'schedule_needed',
//       message: 'This course needs a schedule',
//       createdAt: new Date().toISOString(),
//       read: false
//     };

//     console.log('Notification object created:', notification);

//     // Test add document
//     const docData = await firebase.addDocument('courseNotifications', notification);
//     console.log('Test notification created with ID:', docData.id);

//     res.status(201).json({
//       success: true,
//       notificationId: docData.id,
//       message: 'Test notification created'
//     });
//   } catch (error) {
//     console.error('Error creating test notification:', error);
//     res.status(500).json({
//       error: 'Failed to create test notification',
//       details: error.message
//     });
//   }
// });

// // Node.js and environment test endpoint
// app.get('/api/environment', (req, res) => {
//   try {
//     const envInfo = {
//       node: {
//         version: process.version,
//         versions: process.versions,
//         platform: process.platform,
//         arch: process.arch,
//         env: process.env.NODE_ENV
//       },
//       vercel: {
//         environment: process.env.VERCEL_ENV || 'not set',
//         region: process.env.VERCEL_REGION || 'not set',
//         url: process.env.VERCEL_URL || 'not set'
//       },
//       memory: {
//         rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
//         heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
//         heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
//       },
//       uptime: `${Math.round(process.uptime())} seconds`
//     };

//     res.status(200).json(envInfo);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Export for Vercel
// module.exports = app;




























// server.js - updated with simplified API client
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const https = require('https');
const crypto = require('crypto');

// Create Express app
const app = express();

// Set up middleware
app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Firebase connection state
let firebaseConnected = false;
let projectId = process.env.FIREBASE_PROJECT_ID || 'not connected';

// Simplified Firebase client using API key
// This approach avoids JWT token issues but requires API key and adjusted security rules
const simplifiedFirebase = {
  // Create a document in a collection
  async addDocument(collection, data) {
    try {
      // Generate a unique ID if not provided
      const docId = crypto.randomUUID();

      return await this.setDocument(collection, docId, data);
    } catch (error) {
      console.error(`Error adding document to ${collection}:`, error);
      throw error;
    }
  },

  // Set a document with a specific ID
  async setDocument(collection, docId, data) {
    try {
      return new Promise((resolve, reject) => {
        const projectId = process.env.FIREBASE_PROJECT_ID;

        // Firestore API endpoint
        const path = `/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;

        // Convert data to Firestore format
        const firestoreData = this._convertToFirestoreFields(data);

        // Create request options
        const options = {
          hostname: 'firestore.googleapis.com',
          path,
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Firebase-Client': 'rest-api',
            // No Authorization header - using public API with security rules
          }
        };

        // Create request
        const req = https.request(options, (res) => {
          let responseData = '';

          res.on('data', (chunk) => {
            responseData += chunk;
          });

          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const result = JSON.parse(responseData);

                // Return document with ID
                resolve({
                  id: docId,
                  ...data
                });
              } catch (e) {
                reject(new Error(`Failed to parse response: ${e.message}`));
              }
            } else {
              reject(new Error(`HTTP Error ${res.statusCode}: ${responseData}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        // Send data
        req.write(JSON.stringify({ fields: firestoreData }));
        req.end();
      });
    } catch (error) {
      console.error(`Error setting document ${docId} in ${collection}:`, error);
      throw error;
    }
  },

  // Helper to convert JavaScript objects to Firestore format
  _convertToFirestoreFields(data) {
    const fields = {};

    for (const [key, value] of Object.entries(data)) {
      fields[key] = this._convertValueToFirestore(value);
    }

    return fields;
  },

  // Convert a single value to Firestore format
  _convertValueToFirestore(value) {
    if (value === null || value === undefined) {
      return { nullValue: null };
    }
    else if (typeof value === 'string') {
      return { stringValue: value };
    }
    else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return { integerValue: value.toString() };
      } else {
        return { doubleValue: value };
      }
    }
    else if (typeof value === 'boolean') {
      return { booleanValue: value };
    }
    else if (value instanceof Date) {
      return { timestampValue: value.toISOString() };
    }
    else if (Array.isArray(value)) {
      const values = value.map(item => this._convertValueToFirestore(item));
      return { arrayValue: { values } };
    }
    else if (typeof value === 'object') {
      return {
        mapValue: {
          fields: this._convertToFirestoreFields(value)
        }
      };
    }

    // Default fallback
    return { stringValue: String(value) };
  },

  // Test to see if we can connect to Firestore
  async testConnection() {
    try {
      const testData = {
        message: 'Test connection',
        timestamp: new Date().toISOString()
      };

      // Try to create a test document
      const testDoc = await this.addDocument('test_connections', testData);
      console.log('Firebase test document created with ID:', testDoc.id);

      firebaseConnected = true;
      return true;
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      firebaseConnected = false;
      return false;
    }
  }
};

// Routes

// Home page route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>School Manager API</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          h1 { color: #3490dc; }
          h2 { color: #2779bd; margin-top: 30px; }
          code {
            background: #f8f9fa;
            padding: 2px 5px;
            border-radius: 3px;
          }
          .endpoint {
            background: #f1f5f8;
            border-left: 4px solid #3490dc;
            padding: 10px 15px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <h1>School Manager API Server</h1>
        <p>The API server is running correctly. Below are some test endpoints you can use to verify functionality:</p>

        <h2>Test Endpoints</h2>
        <div class="endpoint">
          <code>GET /api/health</code> - Health check endpoint
        </div>
        <div class="endpoint">
          <code>GET /api/info</code> - Server information
        </div>
        <div class="endpoint">
          <code>GET /api/firebase-debug</code> - Firebase connection debug info
        </div>
        <div class="endpoint">
          <code>GET /api/create-test-notification</code> - Create a test notification
        </div>
      </body>
    </html>
  `);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Server info endpoint
app.get('/api/info', async (req, res) => {
  let testFirebaseConnected = false;

  try {
    testFirebaseConnected = await simplifiedFirebase.testConnection();
  } catch (error) {
    console.error('Firebase connection check failed:', error);
  }

  res.status(200).json({
    serverName: 'School Manager API',
    version: '1.0.0',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    firebase: {
      connected: testFirebaseConnected,
      implementation: 'Simplified REST API',
      projectId
    },
    endpoints: {
      health: '/api/health',
      info: '/api/info',
      notifications: '/api/create-test-notification'
    }
  });
});

// Debug endpoint
app.get('/api/firebase-debug', (req, res) => {
  const envVars = {
    projectIdExists: !!process.env.FIREBASE_PROJECT_ID,
    clientEmailExists: !!process.env.FIREBASE_CLIENT_EMAIL,
    privateKeyExists: !!process.env.FIREBASE_PRIVATE_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID || 'not available',
    clientEmailPrefix: process.env.FIREBASE_CLIENT_EMAIL ?
      process.env.FIREBASE_CLIENT_EMAIL.substring(0, 10) + '...' : 'not available',
    privateKeyLength: process.env.FIREBASE_PRIVATE_KEY ?
      process.env.FIREBASE_PRIVATE_KEY.length : 'not available',
    nodeEnv: process.env.NODE_ENV || 'not set',
    vercelEnv: process.env.VERCEL_ENV || 'not in vercel'
  };

  res.status(200).json({
    firebaseConnected,
    implementation: 'Simplified REST API',
    environmentVariables: envVars,
    timestamp: new Date()
  });
});

// Create test notification endpoint
app.get('/api/create-test-notification', async (req, res) => {
  try {
    console.log('Creating test notification...');

    // Create notification data
    const notification = {
      courseId: 'test-course-123',
      courseName: 'Test Course',
      type: 'schedule_needed',
      message: 'This course needs a schedule',
      createdAt: new Date().toISOString(),
      read: false
    };

    // Add to Firestore
    const result = await simplifiedFirebase.addDocument('courseNotifications', notification);

    console.log('Test notification created with ID:', result.id);

    res.status(201).json({
      success: true,
      notificationId: result.id,
      message: 'Test notification created'
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({
      error: 'Failed to create test notification',
      details: error.message
    });
  }
});

// Debug private key endpoint
app.get('/api/debug-private-key', (req, res) => {
  try {
    // Get the private key from environment variables
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

    // Information about the private key
    const info = {
      length: privateKey.length,
      hasQuotes: privateKey.startsWith('"') && privateKey.endsWith('"'),
      hasNewlines: privateKey.includes('\\n'),
      hasRealNewlines: privateKey.includes('\n'),
      startsWithHeader: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
      endsWithFooter: privateKey.includes('-----END PRIVATE KEY-----'),
      firstChars: privateKey.substring(0, 15) + '...',
      lastChars: '...' + privateKey.substring(privateKey.length - 15)
    };

    // Try to clean the key for display (for safety, only show info about the key)
    if (info.hasQuotes) {
      privateKey = privateKey.slice(1, -1);
      info.lengthAfterRemovingQuotes = privateKey.length;
    }

    if (info.hasNewlines) {
      const cleanedKey = privateKey.replace(/\\n/g, '\n');
      info.lengthAfterReplacingNewlines = cleanedKey.length;
      info.startsWithHeaderAfterCleaning = cleanedKey.includes('-----BEGIN PRIVATE KEY-----');
      info.endsWithFooterAfterCleaning = cleanedKey.includes('-----END PRIVATE KEY-----');
    }

    res.status(200).json({
      privateKeyInfo: info,
      environment: process.env.NODE_ENV,
      vercelEnvironment: process.env.VERCEL_ENV
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error debugging private key',
      message: error.message
    });
  }
});

// Environment information endpoint
app.get('/api/environment', (req, res) => {
  try {
    const envInfo = {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        env: process.env.NODE_ENV
      },
      vercel: {
        environment: process.env.VERCEL_ENV || 'not set',
        region: process.env.VERCEL_REGION || 'not set',
        url: process.env.VERCEL_URL || 'not set'
      },
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
      },
      uptime: `${Math.round(process.uptime())} seconds`
    };

    res.status(200).json(envInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export for Vercel
module.exports = app;
