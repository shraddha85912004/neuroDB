import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * POST /api/datasources/upload
 *
 * Accepts multipart FormData with:
 *   - file: a CSV or Excel (.xlsx / .xls) file
 *   - name: (optional) human-readable name for the data source
 *
 * Workflow:
 *   1. Parse the uploaded file to extract rows and column names.
 *   2. Store the rows in a new internal MongoDB collection
 *      named `uploaded_<firmId>_<timestamp>`.
 *   3. Create a dataSources document with type 'uploaded'.
 *   4. Return the new source ID.
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const sourceName = formData.get('name') || file?.name || 'Uploaded File';

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'A file must be uploaded.' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let rows = [];
    let columns = [];

    if (fileName.endsWith('.csv')) {
      // ---- CSV via papaparse ----
      const text = buffer.toString('utf-8');
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });

      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        return NextResponse.json(
          { error: 'Failed to parse CSV: ' + parsed.errors[0].message },
          { status: 400 }
        );
      }

      rows = parsed.data;
      columns = parsed.meta.fields || [];
    } else if (
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls')
    ) {
      // ---- Excel via xlsx ----
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (rows.length > 0) {
        columns = Object.keys(rows[0]);
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a CSV or Excel file.' },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'The uploaded file contains no data rows.' },
        { status: 400 }
      );
    }

    // ---- Store in MongoDB ----
    const db = await getDb();
    const timestamp = Date.now();
    const collectionName = `uploaded_${session.user.firmId}_${timestamp}`;

    await db.collection(collectionName).insertMany(rows);

    // ---- Create dataSources entry ----
    const schemaCache = {};
    schemaCache[collectionName] = columns;

    const result = await db.collection('dataSources').insertOne({
      firmId: session.user.firmId,
      name: sourceName,
      type: 'uploaded',
      internalCollection: collectionName,
      schemaCache,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        message: 'File uploaded and processed successfully.',
        id: result.insertedId,
        collection: collectionName,
        rowCount: rows.length,
        columns,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
