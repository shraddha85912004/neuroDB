import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import { MongoClient } from 'mongodb';
import mysql from 'mysql2/promise';
import pg from 'pg';
import { NextResponse } from 'next/server';
import { validateQuery } from '@/lib/querySafety';

const { Pool } = pg;

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rawQuery, sourceId, dbType } = await req.json();

    if (!rawQuery || !sourceId || !dbType) {
      return NextResponse.json(
        { error: 'rawQuery, sourceId, and dbType are required.' },
        { status: 400 }
      );
    }

    // Verify the user's firm has access to this data source.
    const internalDb = await getDb();
    const source = await internalDb.collection('dataSources').findOne({
      _id: new ObjectId(sourceId),
      firmId: session.user.firmId,
    });

    if (!source) {
      return NextResponse.json(
        { error: "Data source not found or you don't have access to it." },
        { status: 404 }
      );
    }

    // ----- Safety validation -----
    const queryStr =
      dbType === 'mongodb' ? JSON.stringify(rawQuery) : rawQuery;
    const safety = validateQuery(queryStr, dbType);

    if (!safety.safe) {
      return NextResponse.json(
        { error: safety.reason },
        { status: 403 }
      );
    }

    // ----- Execute the query -----
    let results = [];

    if (dbType === 'mongodb') {
      // rawQuery is expected as: { collection, filter, sort?, limit? }
      const parsed = typeof rawQuery === 'string' ? JSON.parse(rawQuery) : rawQuery;

      if (!parsed.collection) {
        return NextResponse.json(
          { error: 'MongoDB query must include a "collection" field.' },
          { status: 400 }
        );
      }

      const client = new MongoClient(source.uri);
      await client.connect();
      const targetDb = client.db();
      const collection = targetDb.collection(parsed.collection);

      let cursor = collection.find(parsed.filter || {});
      if (parsed.sort) cursor = cursor.sort(parsed.sort);
      cursor = cursor.limit(parsed.limit || 50);

      results = await cursor.toArray();
      await client.close();
    } else if (dbType === 'mysql') {
      const connection = await mysql.createConnection(source.uri);

      let sql = rawQuery;
      if (!sql.toLowerCase().includes('limit')) {
        sql += ' LIMIT 50';
      }

      const [rows] = await connection.execute(sql);
      results = rows;
      await connection.end();
    } else if (dbType === 'postgresql') {
      const pool = new Pool({ connectionString: source.uri });

      let sql = rawQuery;
      if (!sql.toLowerCase().includes('limit')) {
        sql += ' LIMIT 50';
      }

      const res = await pool.query(sql);
      results = res.rows;
      await pool.end();
    } else {
      return NextResponse.json(
        { error: `Unsupported database type: "${dbType}".` },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('Query execution error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
