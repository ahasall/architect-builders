import * as path from 'path';
import * as fs from 'fs';

const projectName = 'angular-builders';
const builderName = 'build';

const root = path.join(__dirname, '..', 'projects', projectName);
const sourceRoot = path.join(root, 'src');

const destinationRoot = path.join(__dirname, '..', 'dist', projectName);
const copyTasks = [
  {
    source: path.join(root, 'package.json'),
    destination: path.join(destinationRoot, 'package.json')
  },
  {
    source: path.join(root, 'builders.json'),
    destination: path.join(destinationRoot, 'builders.json')
  },
  {
    source: path.join(sourceRoot, builderName, 'schema.json'),
    destination: path.join(destinationRoot, 'src', builderName, 'schema.json')
  }
];
copyTasks.forEach(task => {
  fs.copyFileSync(task.source, task.destination);
});
