const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const https = require('https');
const crypto = require('crypto');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

let firebaseConnected = false;
let projectId = process.env.FIREBASE_PROJECT_ID || 'not connected';

const simplifiedFirebase = {
  async addDocument(collection, data) {
    try {
      const docId = crypto.randomUUID();

      return await this.setDocument(collection, docId, data);
    } catch (error) {
      console.error(`Error adding document to ${collection}:`, error);
      throw error;
    }
  },

  async getDocument(collection, docId) {
    try {
      console.log(`Getting document from ${collection}/${docId}`);

      const projectId = process.env.FIREBASE_PROJECT_ID;

      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'firestore.googleapis.com',
          path: `/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Firebase-Client': 'rest-api'
          }
        };

        const req = https.request(options, (res) => {
          let responseData = '';

          res.on('data', (chunk) => {
            responseData += chunk;
          });

          res.on('end', () => {
            if (res.statusCode === 404) {
              console.log(`Document ${collection}/${docId} not found`);
              resolve(null);
            } else if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const result = JSON.parse(responseData);
                console.log(`Document ${collection}/${docId} retrieved successfully`);

                const data = this._firestoreToObject(result.fields || {});

                resolve({
                  id: docId,
                  ...data
                });
              } catch (parseError) {
                console.error('Error parsing Firestore response:', parseError);
                reject(parseError);
              }
            } else {
              console.error(`HTTP Error ${res.statusCode} getting document:`, responseData);
              reject(new Error(`HTTP Error ${res.statusCode}: ${responseData}`));
            }
          });
        });

        req.on('error', (error) => {
          console.error('Request error:', error);
          reject(error);
        });

        req.end();
      });
    } catch (error) {
      console.error(`Error getting document ${docId} from ${collection}:`, error);
      throw error;
    }
  },

  async setDocument(collection, docId, data) {
    try {
      return new Promise((resolve, reject) => {
        const projectId = process.env.FIREBASE_PROJECT_ID;

        const path = `/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;

        const firestoreData = this._convertToFirestoreFields(data);

        const options = {
          hostname: 'firestore.googleapis.com',
          path,
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Firebase-Client': 'rest-api',
          }
        };

        const req = https.request(options, (res) => {
          let responseData = '';

          res.on('data', (chunk) => {
            responseData += chunk;
          });

          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const result = JSON.parse(responseData);

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

        req.write(JSON.stringify({ fields: firestoreData }));
        req.end();
      });
    } catch (error) {
      console.error(`Error setting document ${docId} in ${collection}:`, error);
      throw error;
    }
  },

  _convertToFirestoreFields(data) {
    const fields = {};

    for (const [key, value] of Object.entries(data)) {
      fields[key] = this._convertValueToFirestore(value);
    }

    return fields;
  },

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

    return { stringValue: String(value) };
  },

  async testConnection() {
    try {
      const testData = {
        message: 'Test connection',
        timestamp: new Date().toISOString()
      };

      const testDoc = await this.addDocument('test_connections', testData);
      console.log('Firebase test document created with ID:', testDoc.id);

      firebaseConnected = true;
      return true;
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      firebaseConnected = false;
      return false;
    }
  },

  async getDocumentsWhere(collection, field, operator, value) {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}`;

      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'firestore.googleapis.com',
          path: `/v1/projects/${projectId}/databases/(default)/documents/${collection}`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Firebase-Client': 'rest-api'
          }
        };

        const req = https.request(options, (res) => {
          let responseData = '';

          res.on('data', (chunk) => {
            responseData += chunk;
          });

          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const result = JSON.parse(responseData);

                if (!result.documents) {
                  return resolve([]);
                }

                const filteredDocs = result.documents.filter(doc => {
                  const fieldValue = this._extractFieldValue(doc.fields, field);

                  switch(operator) {
                    case '==': return fieldValue === value;
                    case '!=': return fieldValue !== value;
                    case '>': return fieldValue > value;
                    case '>=': return fieldValue >= value;
                    case '<': return fieldValue < value;
                    case '<=': return fieldValue <= value;
                    default: return false;
                  }
                });

                const documents = filteredDocs.map(doc => {
                  const nameParts = doc.name.split('/');
                  const id = nameParts[nameParts.length - 1];

                  const data = this._firestoreToObject(doc.fields);

                  return {
                    id,
                    ...data
                  };
                });

                resolve(documents);
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

        req.end();
      });
    } catch (error) {
      console.error(`Error querying ${collection} where ${field} ${operator} ${value}:`, error);
      throw error;
    }
  },

  _extractFieldValue(fields, fieldPath) {
    const parts = fieldPath.split('.');
    let current = fields;

    for (const part of parts) {
      if (!current || !current[part]) return undefined;
      current = current[part];
    }

    if (current.booleanValue !== undefined) return current.booleanValue;
    if (current.stringValue !== undefined) return current.stringValue;
    if (current.integerValue !== undefined) return parseInt(current.integerValue, 10);
    if (current.doubleValue !== undefined) return current.doubleValue;
    if (current.nullValue !== undefined) return null;

    return undefined;
  },

  _firestoreToObject(firestoreObj) {
    const result = {};

    for (const [key, value] of Object.entries(firestoreObj)) {
      if (value.nullValue !== undefined) {
        result[key] = null;
      } else if (value.stringValue !== undefined) {
        result[key] = value.stringValue;
      } else if (value.doubleValue !== undefined) {
        result[key] = value.doubleValue;
      } else if (value.integerValue !== undefined) {
        result[key] = parseInt(value.integerValue, 10);
      } else if (value.booleanValue !== undefined) {
        result[key] = value.booleanValue;
      } else if (value.timestampValue !== undefined) {
        result[key] = new Date(value.timestampValue);
      } else if (value.arrayValue !== undefined) {
        result[key] = value.arrayValue.values
          ? value.arrayValue.values.map(item => this._firestoreToObject({ item }).item)
          : [];
      } else if (value.mapValue !== undefined) {
        result[key] = this._firestoreToObject(value.mapValue.fields || {});
      }
    }

    return result;
  },

  async updateField(collection, docId, field, value) {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;

      return new Promise((resolve, reject) => {
        const getOptions = {
          hostname: 'firestore.googleapis.com',
          path: `/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Firebase-Client': 'rest-api'
          }
        };

        const getReq = https.request(getOptions, (getRes) => {
          let responseData = '';

          getRes.on('data', (chunk) => {
            responseData += chunk;
          });

          getRes.on('end', () => {
            if (getRes.statusCode >= 200 && getRes.statusCode < 300) {
              try {
                const document = JSON.parse(responseData);

                const fields = document.fields || {};

                const fieldParts = field.split('.');
                let current = fields;

                for (let i = 0; i < fieldParts.length - 1; i++) {
                  const part = fieldParts[i];
                  if (!current[part] || !current[part].mapValue || !current[part].mapValue.fields) {
                    current[part] = {
                      mapValue: {
                        fields: {}
                      }
                    };
                  }
                  current = current[part].mapValue.fields;
                }

                const lastPart = fieldParts[fieldParts.length - 1];

                if (typeof value === 'boolean') {
                  current[lastPart] = { booleanValue: value };
                } else if (typeof value === 'string') {
                  current[lastPart] = { stringValue: value };
                } else if (typeof value === 'number') {
                  if (Number.isInteger(value)) {
                    current[lastPart] = { integerValue: value.toString() };
                  } else {
                    current[lastPart] = { doubleValue: value };
                  }
                } else if (value === null) {
                  current[lastPart] = { nullValue: null };
                }

                const updateOptions = {
                  hostname: 'firestore.googleapis.com',
                  path: `/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}?updateMask.fieldPaths=${field}`,
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Firebase-Client': 'rest-api'
                  }
                };

                const updateReq = https.request(updateOptions, (updateRes) => {
                  let updateResponseData = '';

                  updateRes.on('data', (chunk) => {
                    updateResponseData += chunk;
                  });

                  updateRes.on('end', () => {
                    if (updateRes.statusCode >= 200 && updateRes.statusCode < 300) {
                      try {
                        const result = JSON.parse(updateResponseData);
                        resolve({
                          id: docId,
                          [field]: value,
                          success: true
                        });
                      } catch (e) {
                        reject(new Error(`Failed to parse update response: ${e.message}`));
                      }
                    } else {
                      reject(new Error(`HTTP Error during update ${updateRes.statusCode}: ${updateResponseData}`));
                    }
                  });
                });

                updateReq.on('error', (error) => {
                  reject(error);
                });

                updateReq.write(JSON.stringify({ fields }));
                updateReq.end();

              } catch (e) {
                reject(new Error(`Failed to parse get response: ${e.message}`));
              }
            } else {
              reject(new Error(`HTTP Error during get ${getRes.statusCode}: ${responseData}`));
            }
          });
        });

        getReq.on('error', (error) => {
          reject(error);
        });

        getReq.end();
      });
    } catch (error) {
      console.error(`Error updating field ${field} in document ${docId} (${collection}):`, error);
      throw error;
    }
  }
};

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>School Manager API</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 900px;
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
        <p>Welcome to the School Manager API. Below is a list of available endpoints and their purposes:</p>

        <h2>Health & Info</h2>
        <div class="endpoint"><code>GET /api/health</code> - Health check endpoint</div>
        <div class="endpoint"><code>GET /api/info</code> - General server and Firebase info</div>
        <div class="endpoint"><code>GET /api/firebase-debug</code> - Firebase environment variable status</div>
        <div class="endpoint"><code>GET /api/debug-private-key</code> - Debug your Firebase private key</div>
        <div class="endpoint"><code>GET /api/environment</code> - View Node.js, Vercel, memory, uptime info</div>

        <h2>Notifications</h2>
        <div class="endpoint"><code>GET /api/create-test-notification</code> - Create a sample test notification in Firestore</div>

        <h2>Courses - Scheduling</h2>
        <div class="endpoint"><code>GET /api/get-pending</code> - Fetch courses with <code>pendingSchedule = true</code></div>
        <div class="endpoint"><code>GET /api/pending-schedule</code> - Mock: Get hardcoded pending schedule list</div>
        <div class="endpoint"><code>POST /api/pending-schedule</code> - Mark a course for scheduling (mocked)</div>
        <div class="endpoint"><code>POST /api/submit-schedule</code> - Submit sessions for a course schedule</div>
        <div class="endpoint"><code>POST /api/check-conflicts</code> - Check for session time conflicts</div>
        <div class="endpoint"><code>POST /api/mark-course-pending</code> - Mark a course's <code>pendingSchedule</code> field as true in Firestore</div>
        <div class="endpoint"><code>GET /api/mark-course-pending/:courseId</code> - Same as above, via GET</div>

        <p>All endpoints return JSON responses and follow RESTful conventions.</p>
      </body>
    </html>
  `);
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

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

app.get('/api/create-test-notification', async (req, res) => {
  try {
    console.log('Creating test notification...');

    const notification = {
      courseId: 'test-course-123',
      courseName: 'Test Course',
      type: 'schedule_needed',
      message: 'This course needs a schedule',
      createdAt: new Date().toISOString(),
      read: false
    };

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

app.get('/api/debug-private-key', (req, res) => {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

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

app.get('/api/get-pending', async (req, res) => {
  try {
    console.log('Fetching courses with pendingSchedule=true');

    const pendingCourses = await simplifiedFirebase.getDocumentsWhere('courses', 'pendingSchedule', '==', true);

    console.log(`Found ${pendingCourses.length} pending courses`);

    res.status(200).json({
      success: true,
      courses: pendingCourses
    });
  } catch (error) {
    console.error('Error fetching pending courses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending courses',
      details: error.message
    });
  }
});


const scheduleOperations = {
  markCourseForScheduling: async (courseId) => {
    try {
      console.log(`Marking course ${courseId} for scheduling`);
      return true;
    } catch (error) {
      console.error('Error marking course for scheduling:', error);
      throw error;
    }
  },

  submitSchedule: async (courseId, sessions) => {
    try {
      console.log(`Submitting schedule for course ${courseId} with ${sessions.length} sessions`);
      return true;
    } catch (error) {
      console.error('Error submitting course schedule:', error);
      throw error;
    }
  },

  getPendingCourses: async () => {
    try {
      console.log('Fetching courses pending scheduling');
      return [
        {
          id: 'course-123',
          name: 'Introduction to Programming',
          teacher: 'John Smith',
          teacherId: 'teacher-456',
          pendingSchedule: true,
          sessions: []
        }
      ];
    } catch (error) {
      console.error('Error fetching pending courses:', error);
      throw error;
    }
  },

  checkConflicts: async (sessions) => {
    try {
      console.log(`Checking conflicts for ${sessions.length} sessions`);
      return [];
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      throw error;
    }
  }
};

function hasTimeOverlap(session1, session2) {
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1 = timeToMinutes(session1.startTime);
  const end1 = timeToMinutes(session1.endTime);
  const start2 = timeToMinutes(session2.startTime);
  const end2 = timeToMinutes(session2.endTime);

  return (start1 < end2 && end1 > start2);
}

app.get('/api/pending-schedule', async (req, res) => {
  try {
    const pendingCourses = await scheduleOperations.getPendingCourses();
    res.status(200).json(pendingCourses);
  } catch (error) {
    console.error('Error fetching pending schedules:', error);
    res.status(500).json({ error: 'Failed to fetch pending schedules' });
  }
});

app.post('/api/pending-schedule', async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    await scheduleOperations.markCourseForScheduling(courseId);
    res.status(200).json({ message: 'Course marked for scheduling' });
  } catch (error) {
    console.error('Error marking course for scheduling:', error);
    res.status(500).json({ error: 'Failed to mark course for scheduling' });
  }
});

app.post('/api/submit-schedule', async (req, res) => {
  try {
    console.log('Received schedule submission request');

    const { courseId, sessions } = req.body;

    if (!courseId || !sessions || !Array.isArray(sessions)) {
      console.log('Invalid request parameters:', { courseId, sessionsProvided: !!sessions, isArray: Array.isArray(sessions) });
      return res.status(400).json({
        error: 'Invalid request parameters',
        details: 'Valid courseId and sessions array are required'
      });
    }

    console.log(`Processing schedule for course ${courseId} with ${sessions.length} sessions`);

    try {
      const existingCourse = await simplifiedFirebase.getDocument('courses', courseId);

      if (!existingCourse) {
        return res.status(404).json({
          error: 'Course not found',
          details: `No course exists with ID ${courseId}`
        });
      }

      console.log('Found existing course with ID:', courseId);

      const processedSessions = sessions.map(session => {
        let processedDate = session.date;
        if (session.date instanceof Date || typeof session.date === 'string') {
          try {
            const dateObj = new Date(session.date);
            processedDate = dateObj.toISOString();
          } catch (dateError) {
            console.error('Error processing date:', dateError);
            processedDate = session.date;
          }
        }

        return {
          ...session,
          date: processedDate
        };
      });

      const updatedCourse = {
        ...existingCourse,
        sessions: processedSessions,
        pendingSchedule: false
      };

      await simplifiedFirebase.setDocument('courses', courseId, updatedCourse);

      console.log(`Successfully scheduled course ${courseId}`);

      res.status(200).json({
        success: true,
        message: 'Course schedule saved successfully',
        courseId,
        sessionCount: sessions.length
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      res.status(500).json({
        error: 'Database operation failed',
        details: dbError.message
      });
    }
  } catch (error) {
    console.error('Schedule submission error:', error);
    res.status(500).json({
      error: 'Failed to process schedule submission',
      details: error.message
    });
  }
});

app.post('/api/check-conflicts', async (req, res) => {
  try {
    const { sessions } = req.body;

    if (!sessions || !Array.isArray(sessions)) {
      return res.status(400).json({ error: 'Valid sessions array is required' });
    }

    const conflicts = await scheduleOperations.checkConflicts(sessions);
    res.status(200).json(conflicts);
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({ error: 'Failed to check for conflicts' });
  }
});

app.post('/api/mark-course-pending', async (req, res) => {
  try {
    console.log('Received request to mark course as pending scheduling');

    const { courseId } = req.body;

    if (!courseId) {
      console.log('Missing courseId in request');
      return res.status(400).json({
        success: false,
        error: 'Missing courseId in request'
      });
    }

    console.log(`Marking course ${courseId} as pending scheduling`);

    const result = await simplifiedFirebase.updateField('courses', courseId, 'pendingSchedule', true);

    console.log(`Successfully marked course ${courseId} as pending scheduling`);

    res.status(200).json({
      success: true,
      message: `Course ${courseId} has been marked as pending scheduling`,
      courseId
    });
  } catch (error) {
    console.error('Error marking course as pending:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark course as pending scheduling',
      details: error.message
    });
  }
});

app.get('/api/mark-course-pending/:courseId', async (req, res) => {
  try {
    console.log('Received GET request to mark course as pending scheduling');

    const { courseId } = req.params;

    if (!courseId) {
      console.log('Missing courseId in request');
      return res.status(400).json({
        success: false,
        error: 'Missing courseId in request'
      });
    }

    console.log(`Marking course ${courseId} as pending scheduling`);

    const result = await simplifiedFirebase.updateField('courses', courseId, 'pendingSchedule', true);

    console.log(`Successfully marked course ${courseId} as pending scheduling`);

    res.status(200).json({
      success: true,
      message: `Course ${courseId} has been marked as pending scheduling`,
      courseId
    });
  } catch (error) {
    console.error('Error marking course as pending:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark course as pending scheduling',
      details: error.message
    });
  }
});

module.exports = app;
