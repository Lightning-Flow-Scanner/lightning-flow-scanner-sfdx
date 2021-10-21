import {glob} from 'glob';

export function FindFlows(dir: string) {

  const getDirectories = function (src) {
    return glob.sync(src + '/**/*.{flow-meta.xml,flow}');
  };
  return getDirectories(dir);

}
