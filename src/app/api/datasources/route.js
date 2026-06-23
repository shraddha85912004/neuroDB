import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { MongoClient } from "mongodb";
import mysql from "mysql2/promise";
import pg from "pg";

const { Pool } = pg;

// Helper: get sample values as string for schema
function formatSample(val) {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'object') return JSON.stringify(val).slice(0, 80);
  return String(val).slice(0, 80);
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  // Don't return the URI to non-admins for security
  const projection = session.user.role === 'admin' 
    ? {} 
    : { uri: 0 };

  const dataSources = await db.collection("dataSources")
    .find({ firmId: session.user.firmId })
    .project(projection)
    .toArray();
  
  return NextResponse.json({ dataSources });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized or insufficient permissions" }, { status: 403 });
  }

  const { name, type, uri } = await req.json();

  if (!name || !type || !uri) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validTypes = ['mongodb', 'mysql', 'postgresql'];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: `Unsupported type. Use: ${validTypes.join(', ')}` }, { status: 400 });
  }

  try {
    let schemaCache = {};

    if (type === 'mongodb') {
      const client = new MongoClient(uri);
      await client.connect();
      const targetDb = client.db();
      const collections = await targetDb.listCollections().toArray();
      
      for (const col of collections) {
        const sampleDocs = await targetDb.collection(col.name).find({}).limit(3).toArray();
        if (sampleDocs.length > 0) {
          // Build enriched schema with field types and samples
          const fields = {};
          for (const key of Object.keys(sampleDocs[0])) {
            if (key === '_id') continue;
            const val = sampleDocs[0][key];
            fields[key] = {
              type: Array.isArray(val) ? 'array' : typeof val,
              sample: formatSample(val)
            };
          }
          schemaCache[col.name] = {
            fields,
            sampleRows: sampleDocs.slice(0, 2).map(d => {
              const { _id, ...rest } = d;
              return rest;
            })
          };
        } else {
          schemaCache[col.name] = { fields: {}, sampleRows: [] };
        }
      }
      await client.close();

    } else if (type === 'mysql') {
      const connection = await mysql.createConnection(uri);
      const [tables] = await connection.execute("SHOW TABLES");
      const tableKey = Object.keys(tables[0])[0];
      
      for (const row of tables) {
        const tableName = row[tableKey];
        const [columns] = await connection.execute(`DESCRIBE \`${tableName}\``);
        const [sampleRows] = await connection.execute(`SELECT * FROM \`${tableName}\` LIMIT 3`);
        
        const fields = {};
        for (const col of columns) {
          fields[col.Field] = {
            type: col.Type,
            nullable: col.Null === 'YES',
            key: col.Key || null,
            sample: sampleRows.length > 0 ? formatSample(sampleRows[0][col.Field]) : null
          };
        }
        schemaCache[tableName] = { fields, sampleRows: sampleRows.slice(0, 2) };
      }
      await connection.end();

    } else if (type === 'postgresql') {
      const pool = new Pool({ connectionString: uri });
      
      const tablesResult = await pool.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
      );
      
      for (const tableRow of tablesResult.rows) {
        const tableName = tableRow.table_name;
        const colsResult = await pool.query(
          `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public'`,
          [tableName]
        );
        const sampleResult = await pool.query(`SELECT * FROM "${tableName}" LIMIT 3`);
        
        const fields = {};
        for (const col of colsResult.rows) {
          fields[col.column_name] = {
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            sample: sampleResult.rows.length > 0 ? formatSample(sampleResult.rows[0][col.column_name]) : null
          };
        }
        schemaCache[tableName] = { fields, sampleRows: sampleResult.rows.slice(0, 2) };
      }
      await pool.end();
    }

    const db = await getDb();
    const result = await db.collection("dataSources").insertOne({
      firmId: session.user.firmId,
      name,
      type,
      uri,
      schemaCache,
      createdAt: new Date()
    });

    return NextResponse.json({ 
      message: "Data Source connected successfully! Schema extracted.", 
      id: result.insertedId,
      tablesFound: Object.keys(schemaCache).length
    }, { status: 201 });

  } catch (error) {
    console.error("Data Source connection error:", error);
    return NextResponse.json({ error: "Failed to connect: " + error.message }, { status: 500 });
  }
}
