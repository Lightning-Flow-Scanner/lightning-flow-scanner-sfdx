import * as glob from 'glob';

export function FindFlows(dir: string): string[] {

  const getDirectories = function (src) {
    return glob.sync(src + '/**/*.{flow-meta.xml,flow}', {
      ignore: ['./node_modules/**']
    });
  };
  return getDirectories(dir);

}
