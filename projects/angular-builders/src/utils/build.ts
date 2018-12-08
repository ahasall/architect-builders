import { Path } from '@angular-devkit/core';
import { exec } from 'child_process';
import { Observable } from 'rxjs';

export function buildTsc(tsConfigRoot: Path): Observable<void> {
  return new Observable(observer => {
    exec(`tsc -p ${tsConfigRoot}`, err => {
      if (err) {
        observer.error(`Typescript compilation failed: ${err}`);

        return;
      }
      observer.next();
      observer.complete();
    });
  });
}
