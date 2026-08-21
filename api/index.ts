import app from '../backend/src/app';
import { initDatabase } from '../backend/src/db/database';

let isInitialized = false;

export default async function handler(req: any, res: any) {
  if (!isInitialized) {
    await initDatabase();
    isInitialized = true;
  }
  return app(req, res);
}
