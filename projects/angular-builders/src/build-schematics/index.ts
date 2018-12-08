import {
  Builder,
  BuilderConfiguration,
  BuilderContext,
  BuildEvent
} from '@angular-devkit/architect';
import { getSystemPath, normalize, resolve } from '@angular-devkit/core';
import { Path } from '@angular-devkit/core';
import { Observable, of } from 'rxjs';
import { concatMap, map, tap } from 'rxjs/operators';
import { copyAssets } from '../utils/copy';
import { buildTsc } from '../utils/build';
import * as fs from 'fs';
import * as path from 'path';

export interface SchematicBuilderOptions {
  assets?: string[];
  tsConfig: string;
}

function getOutDir(tsConfigFilePath): string {
  const tsConfig = fs.readFileSync(tsConfigFilePath).toString('utf-8');
  return JSON.parse(tsConfig).compilerOptions.outDir;
}

export class SchematicBuilder implements Builder<SchematicBuilderOptions> {
  constructor(public context: BuilderContext) {}

  run(
    builderConfig: BuilderConfiguration<Partial<SchematicBuilderOptions>>
  ): Observable<BuildEvent> {
    const options = builderConfig.options;
    const workspaceRootAbsolutePath = this.context.workspace.root;
    const projectPath = builderConfig.root;
    const projectRoot = resolve(workspaceRootAbsolutePath, projectPath);
    const assets = options.assets;
    let tsConfigFilePath;

    tsConfigFilePath = options.tsConfig
      ? getSystemPath(resolve(workspaceRootAbsolutePath, normalize(options.tsConfig)))
      : getSystemPath(
          resolve(workspaceRootAbsolutePath, normalize(path.join(projectRoot, 'tsconfig.json')))
        );

    const outDirPath = getOutDir(tsConfigFilePath) as Path;

    return of(true).pipe(
      tap(() => {
        buildTsc(tsConfigFilePath);
      }),
      concatMap(() => copyAssets(workspaceRootAbsolutePath, projectPath, outDirPath, assets)),
      map(() => ({ success: true }))
    );
  }
}

export default SchematicBuilder;
