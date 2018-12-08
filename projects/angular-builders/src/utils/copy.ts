import * as path from 'path';

import { Path } from '@angular-devkit/core';
import { from, Observable } from 'rxjs';
import * as glob from 'glob';
import * as fs from 'fs';
import { concatMap, map } from 'rxjs/operators';

export function copyAssets(
  workspaceRootAbsolutePath: Path,
  projectPath: Path,
  destinationPath: Path,
  patterns: string[]
): Observable<void> {
  const globs = patterns.map(pattern => path.join(projectPath, pattern));

  return getAllPathNames(globs).pipe(
    concatMap(pathName => {
      const filename = pathName.split(projectPath)[1];
      const source = path.join(workspaceRootAbsolutePath, projectPath, filename);
      const destination = path.join(
        workspaceRootAbsolutePath,
        projectPath,
        destinationPath,
        filename
      );
      return copyFile(source, destination);
    })
  );
}

export function copyFile(sourceAbsolutePath, destinationAbsolutePath): Observable<void> {
  return new Observable(observer => {
    ensureDirectoryExistence(destinationAbsolutePath);
    fs.copyFile(sourceAbsolutePath, destinationAbsolutePath, err => {
      if (err) {
        observer.error(err);
      } else {
        observer.next();
        observer.complete();
      }
    });
  });
}

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function getAllPathNames(patterns: string[]): Observable<string> {
  const patterns$ = from(patterns);
  return patterns$.pipe(
    map(pattern => getMatchingPathNames(pattern)),
    concatMap(fileGroups => from(fileGroups)),
    concatMap(files => from(files))
  );
}

export function getMatchingPathNames(
  globPath: string,
  exclude?: string | string[]
): Observable<string[]> {
  return new Observable(observer => {
    const options = exclude ? { ignore: exclude } : {};
    glob(globPath, options, (error, matches) => {
      if (error) {
        return observer.error(error);
      }
      observer.next(matches);
      observer.complete();
    });
  });
}
