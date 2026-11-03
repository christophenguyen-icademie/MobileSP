import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const packagePath = require.resolve('expo-location/package.json');
const { version } = JSON.parse(readFileSync(packagePath, 'utf8'));

// expo-location 19.0.8 calls a legacy emitter method that modern native modules
// do not expose. Both emitter implementations support subscription.remove().
// Reapply after every install until expo-location includes this fix upstream.
if (version === '19.0.8') {
  const original = 'LocationEventEmitter.removeSubscription(this.eventSubscription);';
  const replacement = 'this.eventSubscription.remove();';

  for (const relativePath of ['src/LocationSubscribers.ts', 'build/LocationSubscribers.js']) {
    const filePath = join(dirname(packagePath), relativePath);
    const source = readFileSync(filePath, 'utf8');

    if (source.includes(original)) {
      writeFileSync(filePath, source.replace(original, replacement));
    } else if (!source.includes(replacement)) {
      throw new Error(`Impossible d'appliquer le correctif expo-location : ${relativePath}`);
    }
  }
}
