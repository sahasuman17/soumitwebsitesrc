import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import { Readable } from 'stream';

export const config = {
  api: { bodyParser: { sizeLimit: '100mb' } },
};

function getDriveClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.drive({ version: 'v3', auth: oauth2Client });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileBase64, fileName } = req.body as { fileBase64: string; fileName: string };
  if (!fileBase64 || !fileName) {
    return res.status(400).json({ error: 'fileBase64 and fileName are required' });
  }

  try {
    const drive = getDriveClient();
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
      pdfUrl: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
    });
  } catch (err: any) {
    console.error('Drive upload error:', err.message);
    return res.status(500).json({ error: err.message ?? 'Upload failed' });
  }
}
