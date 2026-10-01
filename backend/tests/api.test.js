const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');

let mongod;
let user1Token;
let user1;
let user2Token;
let user2;
let adminToken;
let adminUser;
let createdRecipeId;

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
  benchmark: {},
};

function recordTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASSED', details });
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${name}`);
  } else {
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAILED', details });
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${name} - ${details}`);
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('  COOK Recipe API - Automated Test Suite');
  console.log('========================================\n');

  try {
    // 1. Setup in-memory MongoDB
    console.log('[Setup] Starting In-Memory MongoDB Server...');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('[Setup] Connected to in-memory database at', uri);

    // Test 1: Successful Registration (User 1)
    {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Chef Mario',
          email: 'mario@cook.com',
          password: 'SecretPassword123!',
        });
      const passed =
        res.status === 201 &&
        res.body.success === true &&
        res.body.data.token &&
        res.body.data.user.email === 'mario@cook.com' &&
        res.body.data.user.password === undefined;
      user1Token = res.body?.data?.token;
      user1 = res.body?.data?.user;
      recordTest(
        'POST /api/auth/register - Successful registration returns 201 & JWT token without password',
        passed,
        `Status: ${res.status}`
      );
    }

    // Test 2: Duplicate Registration Prevention (409 Conflict)
    {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Mario',
          email: 'mario@cook.com',
          password: 'AnotherPassword123!',
        });
      const passed = res.status === 409 && res.body.success === false;
      recordTest(
        'POST /api/auth/register - Duplicate email registration returns 409 Conflict',
        passed,
        `Status: ${res.status}`
      );
    }

    // Test 3: Registration Validation Failure (400 Bad Request)
    {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'invalid-email',
          password: '123',
        });
      const passed =
        res.status === 400 &&
        res.body.success === false &&
        Array.isArray(res.body.errors) &&
        res.body.errors.length >= 3;
      recordTest(
        'POST /api/auth/register - Invalid input triggers 400 with detailed validation errors',
        passed,
        `Errors: ${JSON.stringify(res.body.errors)}`
      );
    }

    // Register User 2 (for authorization tests)
    {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Luigi Cook',
          email: 'luigi@cook.com',
          password: 'SecretPassword123!',
        });
      user2Token = res.body?.data?.token;
      user2 = res.body?.data?.user;
    }

    // Register Admin User
    {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Admin Boss',
          email: 'admin@cook.com',
          password: 'AdminPassword123!',
          role: 'admin',
        });
      adminToken = res.body?.data?.token;
      adminUser = res.body?.data?.user;
    }

    // Test 4: Successful Login
    {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'mario@cook.com',
          password: 'SecretPassword123!',
        });
      const passed =
        res.status === 200 &&
        res.body.success === true &&
        res.body.data.token &&
        res.body.data.user.email === 'mario@cook.com';
      recordTest(
        'POST /api/auth/login - Successful login returns 200 & new JWT token',
        passed,
        `Status: ${res.status}`
      );
    }

    // Test 5: Login with Invalid Password (401 Unauthorized)
    {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'mario@cook.com',
          password: 'WrongPassword!',
        });
      const passed = res.status === 401 && res.body.success === false;
      recordTest(
        'POST /api/auth/login - Invalid password credentials return 401 Unauthorized',
        passed,
        `Status: ${res.status}`
      );
    }

    // Test 6: Access Protected Profile with Valid Token
    {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user1Token}`);
      const passed =
        res.status === 200 &&
        res.body.success === true &&
        res.body.data.user._id === user1._id;
      recordTest(
        'GET /api/auth/me - Access profile with valid JWT returns 200 & user data',
        passed,
        `User ID: ${res.body?.data?.user?._id}`
      );
    }

    // Test 7: Access Protected Route Without Token (401)
    {
      const res = await request(app).get('/api/auth/me');
      const passed = res.status === 401 && res.body.success === false;
      recordTest(
        'GET /api/auth/me - Missing JWT token returns 401 Unauthorized',
        passed,
        `Status: ${res.status}`
      );
    }

    // Test 8: Access Protected Route With Invalid/Malformed Token (401)
    {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.signature');
      const passed = res.status === 401 && res.body.success === false;
      recordTest(
        'GET /api/auth/me - Malformed JWT token returns 401 Unauthorized',
        passed,
        `Status: ${res.status}`
      );
    }

    // Test 9: Create Recipe with Valid Data & JWT (201 Created)
    {
      const res = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Creamy Garlic Mushroom Fettuccine',
          ingredients: ['300g Fettuccine', '200g Cremini Mushrooms', '3 cloves Garlic', '1 cup Heavy Cream', 'Parmesan'],
          instructions: '1. Boil pasta al dente.\n2. Sauté garlic and mushrooms in butter.\n3. Add cream and parmesan, toss together.',
          category: 'pasta',
          image: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df',
        });
      const passed =
        res.status === 201 &&
        res.body.success === true &&
        res.body.data._id &&
        res.body.data.title === 'Creamy Garlic Mushroom Fettuccine' &&
        res.body.data.createdBy._id === user1._id;
      createdRecipeId = res.body?.data?._id;
      recordTest(
        'POST /api/recipes - Authenticated user creates recipe successfully (201 Created)',
        passed,
        `Recipe ID: ${createdRecipeId}`
      );
    }

    // Test 10: Create Recipe Without Token (401 Unauthorized)
    {
      const res = await request(app)
        .post('/api/recipes')
        .send({
          title: 'Unauthenticated Recipe',
          ingredients: ['Salt'],
          instructions: 'Add salt',
          category: 'other',
        });
      const passed = res.status === 401 && res.body.success === false;
      recordTest(
        'POST /api/recipes - Unauthenticated recipe creation blocked with 401 Unauthorized',
        passed,
        `Status: ${res.status}`
      );
    }

    // Test 11: Create Recipe Validation Failure (400 Bad Request)
    {
      const res = await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: '',
          ingredients: [],
          instructions: '',
          category: '',
        });
      const passed =
        res.status === 400 &&
        res.body.success === false &&
        Array.isArray(res.body.errors);
      recordTest(
        'POST /api/recipes - Missing required fields triggers 400 Validation Error',
        passed,
        `Errors: ${JSON.stringify(res.body.errors)}`
      );
    }

    // Test 12: Retrieve All Recipes (200 OK)
    {
      const res = await request(app).get('/api/recipes');
      const passed =
        res.status === 200 &&
        res.body.success === true &&
        Array.isArray(res.body.data) &&
        res.body.data.length >= 1;
      recordTest(
        'GET /api/recipes - Public endpoint retrieves list of recipes (200 OK)',
        passed,
        `Found ${res.body?.data?.length} recipes`
      );
    }

    // Test 13: Filter Recipes by Category
    {
      const res = await request(app).get('/api/recipes?category=pasta');
      const passed =
        res.status === 200 &&
        res.body.success === true &&
        res.body.data.every((r) => r.category.toLowerCase() === 'pasta');
      recordTest(
        'GET /api/recipes?category=pasta - Successfully filters recipes by category',
        passed,
        `Count: ${res.body?.data?.length}`
      );
    }

    // Test 14: Search Recipes by Query
    {
      const res = await request(app).get('/api/recipes?search=Mushroom');
      const passed =
        res.status === 200 &&
        res.body.success === true &&
        res.body.data.some((r) => r.title.includes('Mushroom'));
      recordTest(
        'GET /api/recipes?search=Mushroom - Successfully searches recipes by keyword',
        passed,
        `Matches: ${res.body?.data?.length}`
      );
    }

    // Test 15: Retrieve Single Recipe by Valid ID (200 OK)
    {
      const res = await request(app).get(`/api/recipes/${createdRecipeId}`);
      const passed =
        res.status === 200 &&
        res.body.success === true &&
        res.body.data._id === createdRecipeId &&
        res.body.data.createdBy.name === 'Chef Mario';
      recordTest(
        'GET /api/recipes/:id - Retrieves single recipe with populated creator (200 OK)',
        passed,
        `Title: ${res.body?.data?.title}`
      );
    }

    // Test 16: Malformed ObjectId Route Parameter (400 Validation Error)
    {
      const res = await request(app).get('/api/recipes/not-a-valid-mongo-id');
      const passed =
        res.status === 400 &&
        res.body.success === false &&
        res.body.message === 'Validation failed';
      recordTest(
        'GET /api/recipes/:id - Malformed MongoDB ObjectId returns 400 Validation Error',
        passed,
        `Status: ${res.status}`
      );
    }

    // Test 17: Non-existent Valid ObjectId (404 Not Found)
    {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app).get(`/api/recipes/${nonExistentId}`);
      const passed = res.status === 404 && res.body.success === false;
      recordTest(
        'GET /api/recipes/:id - Non-existent recipe ID returns 404 Not Found',
        passed,
        `Status: ${res.status}`
      );
    }

    // Test 18: Update Recipe by Creator (200 OK)
    {
      const res = await request(app)
        .put(`/api/recipes/${createdRecipeId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Creamy Garlic & Herb Mushroom Fettuccine (Updated)',
        });
      const passed =
        res.status === 200 &&
        res.body.success === true &&
        res.body.data.title === 'Creamy Garlic & Herb Mushroom Fettuccine (Updated)';
      recordTest(
        'PUT /api/recipes/:id - Recipe creator successfully updates recipe (200 OK)',
        passed,
        `Updated Title: ${res.body?.data?.title}`
      );
    }

    // Test 19: Unauthorized Update by Another User (403 Forbidden)
    {
      const res = await request(app)
        .put(`/api/recipes/${createdRecipeId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Hacked by Luigi',
        });
      const passed = res.status === 403 && res.body.success === false;
      recordTest(
        'PUT /api/recipes/:id - Non-owner user blocked with 403 Forbidden',
        passed,
        `Status: ${res.status}`
      );
    }

    // Test 20: Unauthorized Delete by Another User (403 Forbidden)
    {
      const res = await request(app)
        .delete(`/api/recipes/${createdRecipeId}`)
        .set('Authorization', `Bearer ${user2Token}`);
      const passed = res.status === 403 && res.body.success === false;
      recordTest(
        'DELETE /api/recipes/:id - Non-owner user deletion blocked with 403 Forbidden',
        passed,
        `Status: ${res.status}`
      );
    }

    // Test 21: Delete Recipe by Creator (200 OK)
    {
      const res = await request(app)
        .delete(`/api/recipes/${createdRecipeId}`)
        .set('Authorization', `Bearer ${user1Token}`);
      const passed = res.status === 200 && res.body.success === true;
      recordTest(
        'DELETE /api/recipes/:id - Recipe creator deletes recipe (200 OK)',
        passed,
        `Status: ${res.status}`
      );
    }

    // Test 22: Verify Recipe is Deleted (404 Not Found)
    {
      const res = await request(app).get(`/api/recipes/${createdRecipeId}`);
      const passed = res.status === 404 && res.body.success === false;
      recordTest(
        'GET /api/recipes/:id - Confirms deleted recipe returns 404 Not Found',
        passed,
        `Status: ${res.status}`
      );
    }

    // Test 23: Unknown Route Returns 404 (Centralized Error Handling)
    {
      const res = await request(app).get('/api/unknown-endpoint-testing');
      const passed = res.status === 404 && res.body.success === false;
      recordTest(
        'GET /api/unknown-endpoint - Centralized 404 handler returns standardized JSON',
        passed,
        `Status: ${res.status}`
      );
    }

    // Test 24: Serve Frontend Static Assets (200 OK)
    {
      const res = await request(app).get('/');
      const passed =
        res.status === 200 &&
        res.header['content-type'].includes('text/html') &&
        res.text.includes('COOK');
      recordTest(
        'GET / - Serves connected frontend index.html with 200 OK',
        passed,
        `Content-Type: ${res.header['content-type']}`
      );
    }

    // 2. Performance & Latency Benchmark
    console.log('\n[Benchmark] Running latency load test: 50 consecutive requests to GET /api/recipes...');
    const iterations = 50;
    const latencies = [];

    // Create a recipe first so benchmark has data to query and populate
    await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Benchmark Recipe',
        ingredients: ['Ing 1', 'Ing 2'],
        instructions: 'Cook and serve',
        category: 'benchmark',
      });

    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      await request(app).get('/api/recipes');
      const end = process.hrtime.bigint();
      const latencyMs = Number(end - start) / 1e6;
      latencies.push(latencyMs);
    }

    latencies.sort((a, b) => a - b);
    const minLatency = latencies[0].toFixed(2);
    const maxLatency = latencies[latencies.length - 1].toFixed(2);
    const avgLatency = (latencies.reduce((sum, v) => sum + v, 0) / latencies.length).toFixed(2);
    const p95Latency = latencies[Math.floor(latencies.length * 0.95)].toFixed(2);

    testResults.benchmark = {
      iterations,
      minLatencyMs: parseFloat(minLatency),
      maxLatencyMs: parseFloat(maxLatency),
      avgLatencyMs: parseFloat(avgLatency),
      p95LatencyMs: parseFloat(p95Latency),
    };

    console.log(`  \x1b[36m📊 Benchmark Results\x1b[0m:`);
    console.log(`     Total Requests: ${iterations}`);
    console.log(`     Average Latency: ${avgLatency}ms`);
    console.log(`     p95 Latency:     ${p95Latency}ms`);
    console.log(`     Min / Max:       ${minLatency}ms / ${maxLatency}ms`);

    console.log('\n========================================');
    console.log(`  Summary: ${testResults.passed}/${testResults.total} tests passed (${testResults.failed} failed)`);
    console.log('========================================\n');

    // Output JSON metrics for documentation & resume extraction
    console.log('BENCHMARK_DATA:' + JSON.stringify(testResults.benchmark));
    console.log('TEST_DATA:' + JSON.stringify({ total: testResults.total, passed: testResults.passed, failed: testResults.failed }));

    return testResults;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
  }
}

if (require.main === module) {
  runTests()
    .then((results) => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('[Tests] Unexpected test error:', err);
      process.exit(1);
    });
}

module.exports = runTests;
