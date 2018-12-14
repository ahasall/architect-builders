import { exec } from 'child_process';
import { Observable } from 'rxjs';

export function buildTsc(tsConfigPath: string): Observable<void> {
  return new Observable(observer => {
    exec(`tsc -p ${tsConfigPath}`, err => {
      if (err) {
        observer.error(`Typescript compilation failed: ${err}`);

        return;
      }
      observer.next();
      observer.complete();
    });
  });
}
