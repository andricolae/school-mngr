// index.js
const app = require('./server');

// This code is only run on local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Test the API by visiting http://localhost:${PORT}/api/health`);
  });
}

// Export the Express API
module.exports = app;
