import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

/**
 * GET /api/history
 * Returns query history for the authenticated user's firm,
 * sorted newest-first, capped at 100 entries.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const history = await db
      .collection('queryHistory')
      .find({ firmId: session.user.firmId })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({ history });
  } catch (error) {
    console.error('History GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/history
 * Saves a new query history record.
 *
 * Expected body:
 * {
 *   sourceId, sourceName, sourceType,
 *   naturalLanguageQuery, generatedQuery, explanation,
 *   resultCount, tags
 * }
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const {
      sourceId,
      sourceName,
      sourceType,
      naturalLanguageQuery,
      generatedQuery,
      explanation,
      resultCount,
      tags,
    } = body;

    if (!sourceId || !naturalLanguageQuery) {
      return NextResponse.json(
        { error: 'sourceId and naturalLanguageQuery are required.' },
        { status: 400 }
      );
    }

    const record = {
      firmId: session.user.firmId,
      userId: session.user.id,
      userEmail: session.user.email,
      sourceId,
      sourceName: sourceName || '',
      sourceType: sourceType || '',
      naturalLanguageQuery,
      generatedQuery: generatedQuery || null,
      explanation: explanation || '',
      resultCount: typeof resultCount === 'number' ? resultCount : 0,
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date(),
    };

    const db = await getDb();
    const result = await db.collection('queryHistory').insertOne(record);

    return NextResponse.json(
      { message: 'Query history saved.', id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('History POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
