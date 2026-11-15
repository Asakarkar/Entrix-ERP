// The legacy JWT dependency still expects Node's removed SlowBuffer alias.
const buffer = require('buffer');
if (!buffer.SlowBuffer) {
  buffer.SlowBuffer = buffer.Buffer;
}

require('module-alias/register');
const mongoose = require('mongoose');
const { globSync } = require('glob');
const path = require('path');

const majorNodeVersion = Number(process.versions.node.split('.')[0]);
if (majorNodeVersion < 26) {
  console.log('Please upgrade your node.js version to 26 or greater. 👌\n ');
  process.exit();
}

// import environmental variables from our variables.env file
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

mongoose.connection.on('error', (error) => {
  console.error(`MongoDB connection error: ${error.name}${error.code ? ` (${error.code})` : ''}: ${error.message}`);
});

const modelsFiles = globSync('./src/models/**/*.js');

for (const filePath of modelsFiles) {
  require(path.resolve(filePath));
}

// Start our app!
const app = require('./app');
app.set('port', process.env.PORT || 8888);

async function startServer() {
  if (!process.env.DATABASE) {
    throw new Error('DATABASE must be configured before starting the API.');
  }

  await mongoose.connect(process.env.DATABASE, { serverSelectionTimeoutMS: 10000 });

  const server = app.listen(app.get('port'), () => {
    console.log(`Express running → On PORT : ${server.address().port}`);
  });
  server.on('error', (error) => {
    console.error(`Express startup error: ${error.name}${error.code ? ` (${error.code})` : ''}`);
    process.exitCode = 1;
  });
}

startServer().catch(async (error) => {
  console.error(`Server startup failed: ${error.name}${error.code ? ` (${error.code})` : ''}: ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
