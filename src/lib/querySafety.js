/**
 * Query Safety Validator
 *
 * Checks generated or user-edited queries for dangerous keywords
 * before they are executed against any connected data source.
 * Only read-only operations are permitted.
 */

const SQL_BLOCKED_KEYWORDS = [
  'DROP',
  'DELETE',
  'UPDATE',
  'INSERT',
  'ALTER',
  'TRUNCATE',
  'GRANT',
  'REVOKE',
  'CREATE',
];

const MONGO_BLOCKED_KEYWORDS = [
  '$delete',
  '$drop',
  '$rename',
  '$set',
  '$unset',
  '$push',
  '$pull',
];

/**
 * Validates a query string for safety based on the database type.
 *
 * @param {string} queryString – The raw query (SQL string or JSON-stringified MongoDB query).
 * @param {string} dbType      – One of 'mysql', 'postgresql', or 'mongodb'.
 * @returns {{ safe: boolean, reason: string }}
 */
export function validateQuery(queryString, dbType) {
  if (!queryString || typeof queryString !== 'string') {
    return { safe: false, reason: 'Query string is empty or invalid.' };
  }

  if (dbType === 'mongodb') {
    // For MongoDB the query is expected to be a JSON string (or stringified object).
    const lower = queryString.toLowerCase();

    for (const keyword of MONGO_BLOCKED_KEYWORDS) {
      if (lower.includes(keyword.toLowerCase())) {
        return {
          safe: false,
          reason: `Blocked operation detected: "${keyword}". Only read-only (find) operations are allowed.`,
        };
      }
    }

    return { safe: true, reason: 'Query passed MongoDB safety check.' };
  }

  if (dbType === 'mysql' || dbType === 'postgresql') {
    // Normalise to uppercase for keyword matching.
    const upper = queryString.toUpperCase();

    // Use word-boundary matching so column names like "updated_at" don't trigger a false positive.
    for (const keyword of SQL_BLOCKED_KEYWORDS) {
      const regex = new RegExp(`\\b${keyword}\\b`);
      if (regex.test(upper)) {
        return {
          safe: false,
          reason: `Blocked SQL keyword detected: "${keyword}". Only SELECT queries are allowed.`,
        };
      }
    }

    // Additionally, the query must start with SELECT (after optional whitespace / comments).
    const trimmed = queryString.replace(/^[\s\-\/\*]+/, '').toUpperCase();
    if (!trimmed.startsWith('SELECT')) {
      return {
        safe: false,
        reason: 'Only SELECT queries are allowed. The query must begin with SELECT.',
      };
    }

    return { safe: true, reason: 'Query passed SQL safety check.' };
  }

  return { safe: false, reason: `Unsupported database type: "${dbType}".` };
}
