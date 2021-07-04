import {readdirSync, statSync} from 'fs';
import * as path from 'path';

export function FindIgnoreFile(dir: string) {
  const allFiles = (dir, ext, files?, result?, regex?) => {
    files = files || readdirSync(dir);
    result = result || [];
    regex = regex || new RegExp(`\\${ext}$`);

    for (let i = 0; i < files.length; i++) {
      let file = path.join(dir, files[i]);
      if (statSync(file).isDirectory() && !path.extname(file)) {
        try {
          result = allFiles(file, ext, readdirSync(file), result, regex);
        } catch (error) {
          continue;
        }
      } else {
        if (regex.test(file)) {
          result.push(file);
        }
      }
    }
    return result;
  };
  return allFiles(dir, '.flowscanignore.json');
}
