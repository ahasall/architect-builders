import {
  Builder,
  BuilderConfiguration,
  BuilderContext,
  BuildEvent
} from '@angular-devkit/architect';
import { getSystemPath, normalize, resolve } from '@angular-devkit/core';
import { readJsonFile } from '@angular-devkit/schematics/tools/file-system-utility';
import { Observable, of } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { copyAssets } from '../utils/copy';
import { buildTsc } from '../utils/build';
import * as path from 'path';

export interface SchematicBuilderOptions {
  assets?: string[];
  tsConfig: string;
}

function getOutDir(tsConfigFilePath): string {
  const tsConfigJson = readJsonFile(tsConfigFilePath);
  return tsConfigJson['compilerOptions'].outDir;
}

export class SchematicBuilder implements Builder<SchematicBuilderOptions> {
  constructor(public context: BuilderContext) {}

  run(
    builderConfig: BuilderConfiguration<Partial<SchematicBuilderOptions>>
  ): Observable<BuildEvent> {
    const options = builderConfig.options;
    const workspaceRoot = this.context.workspace.root;
    const projectRelativePath = builderConfig.root;

    const assets = options.assets;
    const tsConfig = options.tsConfig
      ? resolve(workspaceRoot, normalize(options.tsConfig))
      : resolve(workspaceRoot, normalize(path.join(projectRelativePath, 'tsconfig.json')));

    const tsConfigPath = getSystemPath(tsConfig);
    const outDirRelativePath = getOutDir(tsConfigPath);
    const workspacePath = getSystemPath(workspaceRoot);

    return of(true).pipe(
      concatMap(() => buildTsc(tsConfigPath)),
      concatMap(() => copyAssets(workspacePath, projectRelativePath, outDirRelativePath, assets)),
      map(() => ({ success: true }))
    );
  }
}

export default SchematicBuilder;
