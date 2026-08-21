import app from './app';
import { initDatabase } from './db/database';

const PORT = process.env.PORT || 5000;

async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`🔥 Habit Tracker Server running on port ${PORT}`);
  });
}

startServer();
