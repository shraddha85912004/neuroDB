import { GoogleGenAI } from '@google/genai';
import { getDb } from '@/lib/db';
import { MongoClient, ObjectId } from 'mongodb';
import mysql from 'mysql2/promise';
import pg from 'pg';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from 'next/server';
import { validateQuery } from '@/lib/querySafety';

const { Pool } = pg;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateQueryWithRetry(prompt, maxRetries = 2) {
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      let currentPrompt = prompt;
      if (attempt > 0 && lastError) {
        currentPrompt += `\n\nIMPORTANT: Your previous query failed with error: "${lastError}". Please fix the issue and regenerate.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: currentPrompt,
        config: { responseMimeType: "application/json" }
      });

      const parsed = JSON.parse(response.text);
      return parsed;
    } catch (err) {
      lastError = err.message;
      if (attempt === maxRetries) throw err;
    }
  }
}

function buildMongoPrompt(schemaStr, query, chatHistory) {
  let historyContext = '';
  if (chatHistory && chatHistory.length > 0) {
    historyContext = `\nPrevious conversation context:\n${chatHistory.map(h => `User: "${h.user}"\nYou responded with query: ${JSON.stringify(h.query)}`).join('\n')}\nThe user is now refining their request. Use the context above to understand what they want.\n`;
  }

  return `
You are an expert at converting natural language queries into structured MongoDB queries.
The user will ask for data. Determine which collection they want based on the schema.
Return a JSON object with the query AND an explanation.

Database Schema (Collections and their fields with types and sample values):
${schemaStr}
${historyContext}
IMPORTANT RULES:
1. ONLY use collections and fields that exist in the schema above. DO NOT hallucinate field names.
2. For string matching, ALWAYS use case-insensitive regex. Example: { "city": { "$regex": "new york", "$options": "i" } }
3. Support complex queries using $and, $or, $gt, $lt, $gte, $lte, $ne, $in, $nin, $exists, $regex
4. Return ONLY a valid JSON object. No markdown.
5. NEVER generate destructive operations ($delete, $drop, etc.)

Format of the JSON object:
{
  "collection": "string",
  "filter": { ... },
  "sort": { "field": 1 },
  "limit": number,
  "explanation": "A plain English explanation of what this query does, step by step. Make it understandable by non-technical users.",
  "chartSuggestion": {
    "type": "bar|line|pie|table",
    "xAxis": "fieldName",
    "yAxis": "fieldName"
  }
}

For chartSuggestion:
- Use "bar" for comparing categories (e.g., count by city)
- Use "line" for time-series data
- Use "pie" for proportional data (e.g., role distribution)
- Use "table" if the data is best viewed as a table
- Set xAxis/yAxis to the relevant field names
- If unsure, use "table"

User Query: "${query}"
`;
}

function buildSQLPrompt(schemaStr, query, dbType, chatHistory) {
  let historyContext = '';
  if (chatHistory && chatHistory.length > 0) {
    historyContext = `\nPrevious conversation context:\n${chatHistory.map(h => `User: "${h.user}"\nYou responded with query: ${JSON.stringify(h.query)}`).join('\n')}\nThe user is now refining their request. Use the context above to understand what they want.\n`;
  }

  return `
You are an expert at converting natural language queries into ${dbType === 'mysql' ? 'MySQL' : 'PostgreSQL'} SELECT queries.
The user will ask for data. Determine which table they want based on the schema.
Return a JSON object with the SQL query AND an explanation.

Database Schema (Tables, columns, types, and sample values):
${schemaStr}
${historyContext}
IMPORTANT RULES:
1. ONLY use tables and columns that exist in the schema above. DO NOT hallucinate column names.
2. Write ONLY safe, read-only SELECT queries. NEVER use DROP, DELETE, UPDATE, INSERT, ALTER, TRUNCATE, GRANT, or REVOKE.
3. Use LIKE '%term%' for case-insensitive string matching.
4. You can JOIN tables if necessary (infer foreign keys from column names like user_id).
5. Always add a LIMIT clause (max 100).
6. Return ONLY a valid JSON object. No markdown.

Format of the JSON object:
{
  "sql": "SELECT ...",
  "explanation": "A plain English explanation of what this query does, step by step. Make it understandable by non-technical users.",
  "chartSuggestion": {
    "type": "bar|line|pie|table",
    "xAxis": "columnName",
    "yAxis": "columnName"
  }
}

For chartSuggestion:
- Use "bar" for comparing categories
- Use "line" for time-series data
- Use "pie" for proportional data
- Use "table" if the data is best viewed as a table
- Set xAxis/yAxis to the relevant column names
- If unsure, use "table"

User Query: "${query}"
`;
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API Key is missing" }, { status: 500 });
    }

    const { query, sourceId, chatHistory } = await req.json();

    if (!query || !sourceId) {
      return NextResponse.json({ error: 'Query and sourceId are required' }, { status: 400 });
    }

    // Get the Data Source configuration
    const internalDb = await getDb();
    const source = await internalDb.collection('dataSources').findOne({ 
      _id: new ObjectId(sourceId),
      firmId: session.user.firmId 
    });

    if (!source) {
      return NextResponse.json({ error: "Data Source not found or access denied" }, { status: 404 });
    }

    const schemaStr = JSON.stringify(source.schemaCache, null, 2);

    // Build the prompt based on DB type
    let prompt;
    if (source.type === 'mongodb' || source.type === 'uploaded') {
      prompt = buildMongoPrompt(schemaStr, query, chatHistory);
    } else if (source.type === 'mysql' || source.type === 'postgresql') {
      prompt = buildSQLPrompt(schemaStr, query, source.type, chatHistory);
    } else {
      return NextResponse.json({ error: "Unsupported database type" }, { status: 400 });
    }

    // Generate query with retry
    let generatedQuery;
    let lastExecutionError = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        let retryPrompt = prompt;
        if (lastExecutionError) {
          retryPrompt += `\n\nIMPORTANT: Your previous query failed with this error: "${lastExecutionError}". Please fix the issue and generate a corrected query.`;
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: retryPrompt,
          config: { responseMimeType: "application/json" }
        });

        generatedQuery = JSON.parse(response.text);

        // Safety check
        if (source.type === 'mysql' || source.type === 'postgresql') {
          const safety = validateQuery(generatedQuery.sql, source.type);
          if (!safety.safe) {
            return NextResponse.json({ error: `Unsafe query blocked: ${safety.reason}` }, { status: 400 });
          }
        } else {
          const safety = validateQuery(JSON.stringify(generatedQuery.filter || {}), 'mongodb');
          if (!safety.safe) {
            return NextResponse.json({ error: `Unsafe query blocked: ${safety.reason}` }, { status: 400 });
          }
        }

        // Execute the query
        let results = [];

        if (source.type === 'mongodb') {
          const client = new MongoClient(source.uri);
          await client.connect();
          const targetDb = client.db();
          const collection = targetDb.collection(generatedQuery.collection);

          let cursor = collection.find(generatedQuery.filter || {});
          if (generatedQuery.sort) cursor = cursor.sort(generatedQuery.sort);
          cursor = cursor.limit(generatedQuery.limit || 50);

          results = await cursor.toArray();
          await client.close();

        } else if (source.type === 'uploaded') {
          // Query the internal MongoDB collection
          const collection = internalDb.collection(source.internalCollection);
          let cursor = collection.find(generatedQuery.filter || {});
          if (generatedQuery.sort) cursor = cursor.sort(generatedQuery.sort);
          cursor = cursor.limit(generatedQuery.limit || 50);
          results = await cursor.toArray();

        } else if (source.type === 'mysql') {
          const connection = await mysql.createConnection(source.uri);
          let sql = generatedQuery.sql;
          if (!sql.toLowerCase().includes('limit')) sql += " LIMIT 50";
          const [rows] = await connection.execute(sql);
          results = rows;
          await connection.end();

        } else if (source.type === 'postgresql') {
          const pool = new Pool({ connectionString: source.uri });
          let sql = generatedQuery.sql;
          if (!sql.toLowerCase().includes('limit')) sql += " LIMIT 50";
          const res = await pool.query(sql);
          results = res.rows;
          await pool.end();
        }

        // Save to audit log
        await internalDb.collection('auditLogs').insertOne({
          userId: session.user.id,
          userEmail: session.user.email,
          firmId: session.user.firmId,
          sourceId: source._id.toString(),
          sourceName: source.name,
          naturalLanguageQuery: query,
          generatedQuery,
          resultCount: results.length,
          action: 'query',
          timestamp: new Date()
        });

        return NextResponse.json({
          data: results,
          generatedQuery,
          explanation: generatedQuery.explanation || null,
          chartSuggestion: generatedQuery.chartSuggestion || null
        });

      } catch (execError) {
        lastExecutionError = execError.message;
        if (attempt === 2) {
          return NextResponse.json({ 
            error: `Query failed after 3 attempts: ${execError.message}`,
            generatedQuery 
          }, { status: 500 });
        }
        // Loop will retry with error context
      }
    }

  } catch (error) {
    console.error("Query execution error", error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
