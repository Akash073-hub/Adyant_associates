const { Octokit } = require('@octokit/rest');

const collections = ['users', 'visits'];

function csvValue(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function recordsToCsv(records) {
  const columns = [...new Set(
    records.flatMap((record) => Object.keys(record).filter((key) => key !== 'passwordHash'))
  )];
  if (columns.length === 0) return '';
  const rows = records.map((record) =>
    columns.map((column) => csvValue(record[column])).join(',')
  );
  return `${columns.join(',')}\n${rows.join('\n')}\n`;
}

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
    let response;
    try {
      response = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `Update ${collection}`,
        content: Buffer.from(content).toString('base64'),
        ...(sha ? { sha } : {}),
      });
    } catch (error) {
      if (error.status === 404) {
        const accessError = new Error(
          `GitHub cannot access ${owner}/${repo}. Check the repository name and ensure the token has Contents read/write access.`
        );
        accessError.status = 502;
        accessError.cause = error;
        throw accessError;
      }
      throw error;
    }

    const csvPath = `${dataPath}/${collection}.csv`;
    const existingCsv = await getFile(csvPath);
    try {
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: csvPath,
        message: `Update ${collection} table`,
        content: Buffer.from(recordsToCsv(records)).toString('base64'),
        ...(existingCsv.sha ? { sha: existingCsv.sha } : {}),
      });
    } catch (error) {
      if (error.status === 404) {
        const accessError = new Error(
          `GitHub cannot access ${owner}/${repo}. Check the repository name and ensure the token has Contents read/write access.`
        );
        accessError.status = 502;
        accessError.cause = error;
        throw accessError;
      }
      throw error;
    }
    return response.data.content.sha;
  }

  async function getFile(path) {
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      if (Array.isArray(data) || data.type !== 'file') {
        throw new Error(`GitHub path is not a file: ${path}`);
      }
      return { sha: data.sha };
    } catch (error) {
      if (error.status !== 404) throw error;
      return { sha: undefined };
    }
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

module.exports = { createGithubDb, recordsToCsv };
