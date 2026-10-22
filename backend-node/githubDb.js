const { Octokit } = require('@octokit/rest');

const collections = ['users', 'visits'];

function createGithubDb({ token, owner, repo, dataPath = 'data' }) {
  if (!token || !owner || !repo) {
    throw new Error('GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO are required');
  }

  const octokit = new Octokit({ auth: token });

  async function readCollection(collection) {
    if (!collections.includes(collection)) {
      throw new Error(`Unsupported data collection: ${collection}`);
    }

    const path = `${dataPath}/${collection}.json`;
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      if (Array.isArray(data) || data.type !== 'file') {
        throw new Error(`GitHub path is not a file: ${path}`);
      }
      return {
        records: JSON.parse(Buffer.from(data.content, 'base64').toString('utf8')),
        sha: data.sha,
        path,
      };
    } catch (error) {
      if (error.status !== 404) throw error;
      return { records: [], sha: undefined, path };
    }
  }

  async function writeCollection(collection, records, sha) {
    const { path } = await readCollection(collection);
    const content = `${JSON.stringify(records, null, 2)}\n`;
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Update ${collection}`,
      content: Buffer.from(content).toString('base64'),
      ...(sha ? { sha } : {}),
    });
    return response.data.content.sha;
  }

  async function append(collection, record) {
    const current = await readCollection(collection);
    const records = [...current.records, record];
    await writeCollection(collection, records, current.sha);
    return record;
  }

  async function update(collection, predicate, updateRecord) {
    const current = await readCollection(collection);
    const records = current.records.map((record) =>
      predicate(record) ? updateRecord(record) : record
    );
    await writeCollection(collection, records, current.sha);
    return records;
  }

  return { readCollection, writeCollection, append, update };
}

module.exports = { createGithubDb };
