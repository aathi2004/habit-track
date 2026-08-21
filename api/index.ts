import app from '../backend/src/app';
import { initDatabase } from '../backend/src/db/database';

let isInitialized = false;

export default async function handler(req: any, res: any) {
  try {
    if (!isInitialized) {
      await initDatabase();
      isInitialized = true;
    }
    return app(req, res);
  } catch (err: any) {
    console.error('Vercel Serverless Handler Error:', err);
    return res.status(500).json({
      error: 'A server error occurred during request initialization',
      details: err.message || String(err),
    });
  }
}
