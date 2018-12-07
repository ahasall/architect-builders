import {
  Builder,
  BuilderConfiguration,
  BuilderContext,
  BuildEvent
} from '@angular-devkit/architect';
import { resolve } from '@angular-devkit/core';

import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface SchematicBuilderOptions {
  buildTarget: string;
}

export class SchematicBuilder implements Builder<SchematicBuilderOptions> {
  constructor(public context: BuilderContext) {}

  run(
    builderConfig: BuilderConfiguration<Partial<SchematicBuilderOptions>>
  ): Observable<BuildEvent> {
    const options = builderConfig.options;
    const root = this.context.workspace.root;
    const projectRoot = resolve(root, builderConfig.root);
    return of(true).pipe(
      tap(() => {
        console.log(`⚽️ I am able to run`);
        console.log(options);
        console.log(projectRoot);
      }),
      map(() => ({ success: true }))
    );
  }
}

export default SchematicBuilder;
