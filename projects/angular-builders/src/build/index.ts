import {
  Builder,
  BuilderConfiguration,
  BuilderContext,
  BuildEvent
} from '@angular-devkit/architect';
import { getSystemPath, join, normalize, resolve } from '@angular-devkit/core';
import { readJsonFile } from '@angular-devkit/schematics/tools/file-system-utility';
import { Observable, of } from 'rxjs';
import { concatMap, map, reduce, tap } from 'rxjs/operators';
import { copyFile, getAllRelativePathNames } from '../utils/copy';
import * as path from 'path';
import { spawn } from 'child_process';

export interface SchematicBuilderOptions {
  tsConfig: string;
  assets?: string[];
  watch?: boolean;
}

function getOutDir(tsConfigFilePath): string {
  const tsConfigJson = readJsonFile(tsConfigFilePath);
  return tsConfigJson['compilerOptions'].outDir;
}

export class SchematicBuilder implements Builder<SchematicBuilderOptions> {
  constructor(public context: BuilderContext) {}

  run(builderConfig: BuilderConfiguration<SchematicBuilderOptions>): Observable<BuildEvent> {
    const workspaceRoot = this.context.workspace.root;
    const projectRelativePath = builderConfig.root;
    const options = builderConfig.options;
    const watch = options.watch;
    const assets = options.assets;

    const tsConfig = options.tsConfig
      ? resolve(workspaceRoot, normalize(options.tsConfig))
      : resolve(workspaceRoot, normalize(path.join(projectRelativePath, 'tsconfig.json')));

    const tsConfigPath = getSystemPath(tsConfig);
    const workspacePath = getSystemPath(workspaceRoot);
    const destinationRelativePath = getOutDir(tsConfigPath);

    return of(true).pipe(
      concatMap(() => this.buildTsc(tsConfigPath, watch)),
      concatMap(() =>
        this.copyAssets(workspacePath, projectRelativePath, destinationRelativePath, assets)
      ),
      map(() => ({ success: true }))
    );
  }

  private buildTsc(tsConfigPath: string, watch: boolean = false): Observable<BuildEvent> {
    const tscPath = getSystemPath(
      join(this.context.workspace.root, '/node_modules/typescript/bin/tsc')
    );
    return new Observable(observer => {
      const args = ['-p', tsConfigPath];
      try {
        if (watch) {
          args.push('--watch');
        }
        const tsc = spawn(tscPath, args);

        tsc.stdout.on('data', buffer => {
          // TODO: filter buffer
          this.context.logger.log('info', `🏗 ${buffer.toString()}`);
          observer.next({ success: true });
        });

        tsc.on('exit', code => {
          this.context.logger.log('info', '✅ Successfully compiled Typescript files');
          observer.next({ success: code === 0 });
          observer.complete();
        });
      } catch (error) {
        if (error) {
          observer.error(`Typescript compilation failed: ${error}`);
        }
      }
    });
  }

  private copyAssets(
    workspacePath: string,
    projectRelativePath: string,
    destinationRelativePath: string,
    patterns: string[]
  ): Observable<string[]> {
    const globs = patterns.map(pattern => path.join(projectRelativePath, pattern));
    const projectAbsolutePath = path.join(workspacePath, projectRelativePath);

    return getAllRelativePathNames(globs).pipe(
      map(pathName => pathName.split(projectRelativePath)[1]),
      concatMap(fileName => {
        const source = path.join(projectAbsolutePath, fileName);
        const destination = path.join(projectAbsolutePath, destinationRelativePath, fileName);
        return copyFile(source, destination);
      }),
      reduce((acc: string[], val: string) => [...acc, val], []),
      tap(files => {
        const message = `✅ Successfully copied the following assets: ${files}`;
        this.context.logger.log('debug', message);
      })
    );
  }
}

export default SchematicBuilder;
