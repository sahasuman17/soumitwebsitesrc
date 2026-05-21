import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import { Readable } from 'stream';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileBase64, fileName } = req.body as { fileBase64: string; fileName: string };

  if (!fileBase64 || !fileName) {
    return res.status(400).json({ error: 'fileBase64 and fileName are required' });
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) {
    return res.status(500).json({ error: 'Google service account credentials are not configured' });
  }

  try {
    const auth = new google.auth.JWT({
      email,
      key: rawKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const buffer = Buffer.from(fileBase64, 'base64');
    const stream = Readable.from(buffer);

    const fileMetadata: { name: string; parents?: string[] } = { name: fileName };
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (folderId) fileMetadata.parents = [folderId];

    const uploaded = await drive.files.create({
      requestBody: fileMetadata,
      media: { mimeType: 'application/pdf', body: stream },
      fields: 'id',
    });

    const fileId = uploaded.data.id!;

    await drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    return res.status(200).json({
      fileId,
      pdfUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
    });
  } catch (err: any) {
    console.error('Google Drive upload error:', err);
    return res.status(500).json({ error: err.message ?? 'Upload failed' });
  }
}
