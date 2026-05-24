import type { VercelRequest, VercelResponse } from '@vercel/node';
import { JWT } from 'google-auth-library';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

async function uploadToFirebaseStorage(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL!;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n');
  const bucket = process.env.VITE_FIREBASE_STORAGE_BUCKET!;

  const jwtClient = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/devstorage.full_control'],
  });

  const { token } = await jwtClient.getAccessToken();
  const filePath = `books/${Date.now()}_${fileName}`;
  const encodedPath = encodeURIComponent(filePath);

  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?name=${encodedPath}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': mimeType,
    },
    body: buffer,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firebase Storage upload failed: ${text}`);
  }

  const data = await response.json() as { downloadTokens?: string };
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media&token=${data.downloadTokens}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileBase64, fileName, mimeType } = req.body as {
    fileBase64: string;
    fileName: string;
    mimeType?: string;
  };

  if (!fileBase64 || !fileName) {
    return res.status(400).json({ error: 'fileBase64 and fileName are required' });
  }

  try {
    const buffer = Buffer.from(fileBase64, 'base64');
    const url = await uploadToFirebaseStorage(buffer, fileName, mimeType ?? 'application/pdf');
    return res.status(200).json({ url });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message ?? 'Upload failed' });
  }
}
