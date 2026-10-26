import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export const webRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const localEngineering=path.resolve(webRoot,'../03 cyberbrick mini T');
// Preserve the original local project layout; a fresh clone is self-contained.
export const engineeringRoot=process.env.MAKER_CAR_ENGINEERING_DIR
 ?path.resolve(process.env.MAKER_CAR_ENGINEERING_DIR)
 :existsSync(path.join(localEngineering,'fusion/MakerCar/MakerCar.py'))
  ?localEngineering:path.join(webRoot,'engineering');
