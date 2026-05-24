/**
 * Uploads a PDF to Google Drive and updates the pdfUrl in the Firestore books table.
 *
 * Usage:
 *   npx tsx test-drive-upload.ts <pdf-path> [book-id]
 *
 * Examples:
 *   npx tsx test-drive-upload.ts ./sample.pdf
 *   npx tsx test-drive-upload.ts ./sample.pdf abc123bookId
 */

import 'dotenv/config';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { readFileSync, existsSync } from 'fs';
import { basename } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

// ── Args ──────────────────────────────────────────────────────────────────────

const pdfPath = process.argv[2];
const bookId  = process.argv[3];

if (!pdfPath) {
  console.error('Usage: npx tsx test-drive-upload.ts <pdf-path> [book-id]');
  process.exit(1);
}
if (!existsSync(pdfPath)) {
  console.error(`File not found: ${pdfPath}`);
  process.exit(1);
}

// ── Validate env ──────────────────────────────────────────────────────────────

const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN'];
const missing  = required.filter(v => !process.env[v]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`);
  process.exit(1);
}

// ── Firebase Admin init ───────────────────────────────────────────────────────

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const firestore = admin.firestore();

// ── Drive client (same as api/upload-to-drive.ts) ─────────────────────────────

function getDriveClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.drive({ version: 'v3', auth: oauth2Client });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Upload PDF to Google Drive
  const fileName = basename(pdfPath);
  const buffer   = readFileSync(pdfPath);
  const stream   = Readable.from(buffer);

  console.log(`\nUploading "${fileName}" (${(buffer.length / 1024).toFixed(1)} KB) to Google Drive...`);

  const drive        = getDriveClient();
  const fileMetadata: { name: string; parents?: string[] } = { name: fileName };
  const folderId     = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (folderId) fileMetadata.parents = [folderId];

  const uploaded = await drive.files.create({
    requestBody: fileMetadata,
    media: { mimeType: 'application/pdf', body: stream },
    fields: 'id,name',
  });

  const fileId = uploaded.data.id!;
  console.log(`✓ Uploaded  — file ID: ${fileId}`);

  // 2. Make publicly readable
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });
  console.log('✓ Permission set to public reader');

  const pdfUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

  console.log('\n─── Drive URLs ───────────────────────────────────────');
  console.log(`Share URL : ${pdfUrl}`);
  console.log(`Embed URL : https://drive.google.com/file/d/${fileId}/preview`);
  console.log('──────────────────────────────────────────────────────');

  // 3. Optionally update Firestore books table
  if (bookId) {
    console.log(`\nUpdating Firestore books/${bookId} with new pdfUrl...`);
    const bookRef = firestore.collection('books').doc(bookId);
    const snap    = await bookRef.get();

    if (!snap.exists) {
      console.error(`✗ Book "${bookId}" not found in Firestore.`);
      process.exit(1);
    }

    await bookRef.update({ pdfUrl });
    console.log(`✓ books/${bookId}.pdfUrl updated successfully.`);
    console.log(`  Title: "${snap.data().title}"`);
  } else {
    // Show all books so the user can pick one to update
    console.log('\nNo book ID provided. Listing all books in Firestore:\n');
    const snap = await firestore.collection('books').orderBy('title').get();
    if (snap.empty) {
      console.log('  (no books found)');
    } else {
      snap.docs.forEach((d: any) => {
        const data = d.data();
        const flag = data.pdfUrl?.includes('w3.org') ? ' ← dummy URL' : '';
        console.log(`  ${d.id}  "${data.title}"${flag}`);
      });
      console.log(`\nRe-run with a book ID to update it:\n  npx tsx test-drive-upload.ts ${pdfPath} <book-id>`);
    }
  }
}

main().catch(err => {
  console.error('\n✗ Failed:', err.message ?? err);
  process.exit(1);
});
