require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createGithubDb } = require('./githubDb');

const requiredEnvironment = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO', 'JWT_SECRET'];
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);
if (missingEnvironment.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvironment.join(', ')}`);
}

const app = express();
const port = Number(process.env.PORT || 5001);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const db = createGithubDb({
  token: process.env.GITHUB_TOKEN,
  owner: process.env.GITHUB_OWNER,
  repo: process.env.GITHUB_REPO,
  dataPath: process.env.GITHUB_DATA_PATH || 'data',
});

app.use(cors({ origin: frontendUrl }));
app.use(express.json({ limit: '32kb' }));

function requiredString(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    const error = new Error(`${field} is required`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}

function publicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function issueToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
}

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'adyant-associates-node-api' });
});

app.post('/api/register', async (request, response, next) => {
  try {
    const name = requiredString(request.body.name, 'name');
    const email = requiredString(request.body.email, 'email').toLowerCase();
    const password = requiredString(request.body.password, 'password');
    if (password.length < 6) {
      return response.status(400).json({ error: 'password must be at least 6 characters' });
    }

    const current = await db.readCollection('users');
    if (current.records.some((user) => user.email === email)) {
      return response.status(409).json({ error: 'A user with that email already exists' });
    }

    const user = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      loginCount: 0,
      createdAt: new Date().toISOString(),
    };
    await db.writeCollection('users', [...current.records, user], current.sha);
    return response.status(201).json({ user: publicUser(user), token: issueToken(user) });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/login', async (request, response, next) => {
  try {
    const email = requiredString(request.body.email, 'email').toLowerCase();
    const password = requiredString(request.body.password, 'password');
    const current = await db.readCollection('users');
    const user = current.records.find((candidate) => candidate.email === email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return response.status(401).json({ error: 'Invalid email or password' });
    }

    const updatedUser = { ...user, loginCount: (user.loginCount || 0) + 1 };
    await db.update('users', (candidate) => candidate.id === user.id, () => updatedUser);
    return response.json({ user: publicUser(updatedUser), token: issueToken(updatedUser) });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/visit', async (request, response, next) => {
  try {
    const visit = {
      id: crypto.randomUUID(),
      path: requiredString(request.body.path || '/', 'path'),
      createdAt: new Date().toISOString(),
    };
    await db.append('visits', visit);
    return response.status(201).json({ visit });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _request, response, _next) => {
  const status = error.status || 502;
  console.error(error);
  response.status(status).json({ error: status === 502 ? 'Backend persistence request failed' : error.message });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = { app };
