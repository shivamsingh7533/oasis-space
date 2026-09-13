// Load .env BEFORE any ESM import that reads process.env at module scope.
// Must be imported first in index.js (ESM evaluates imports in declaration order).
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const serverDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

dotenv.config({ path: path.join(serverDir, '.env') });

export default {};