import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

/**
 * DELETE /api/datasources/[id]
 *
 * Removes a data source document if:
 *   - The authenticated user has the 'admin' role.
 *   - The data source belongs to the user's firm.
 *
 * If the source type is 'uploaded', the associated internal
 * MongoDB collection is also dropped.
 */
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can delete data sources.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'A valid data source ID is required.' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const source = await db.collection('dataSources').findOne({
      _id: new ObjectId(id),
      firmId: session.user.firmId,
    });

    if (!source) {
      return NextResponse.json(
        { error: "Data source not found or you don't have access to it." },
        { status: 404 }
      );
    }

    // If it was an uploaded file, drop the internal collection.
    if (source.type === 'uploaded' && source.internalCollection) {
      try {
        await db.collection(source.internalCollection).drop();
      } catch (dropErr) {
        // Collection may already have been dropped – not fatal.
        console.warn(
          `Could not drop collection "${source.internalCollection}":`,
          dropErr.message
        );
      }
    }

    await db.collection('dataSources').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: 'Data source deleted successfully.' });
  } catch (error) {
    console.error('Data source delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
