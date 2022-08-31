import * as path from 'path';

import { workspace } from 'vscode';

import CsprojReader from './project/csprojReader';
import ProjectJsonReader from './project/projectJsonReader';
import ProjectReader from './project/projectReader';

export default class NamespaceDetector {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  public async getNamespace(): Promise<string> {
    const projectReaders = new Array<ProjectReader>();
    const csprojReader = await CsprojReader.createFromPath(this.filePath);

    if (csprojReader) {
      projectReaders.push(csprojReader);

      const fullNamespace = await this.getRootNamespace(csprojReader);

      if (fullNamespace) return fullNamespace;
    }

    const projectJsonReader = await ProjectJsonReader.createFromPath(
      this.filePath
    );

    if (projectJsonReader) {
      projectReaders.push(projectJsonReader);

      const fullNamespace = await this.getRootNamespace(projectJsonReader);

      if (fullNamespace) return fullNamespace;
    }

    return await this.fromFilepath(projectReaders);
  }

  private async getRootNamespace(
    projectReader: ProjectReader | undefined
  ): Promise<string | undefined> {
    if (!projectReader) return;

    const rootNamespace = await projectReader.getRootNamespace();

    if (!rootNamespace) return;

    return this.calculateFullNamespace(
      rootNamespace,
      path.dirname(projectReader.getFilePath())
    );
  }

  private async getRootPath(
    projectReaders: Array<ProjectReader>
  ): Promise<string> {
    for (const projectReader of projectReaders) {
      if (projectReader) {
        const projectPath = projectReader.getFilePath();

        if (projectPath) {
          const projectPathSplit = projectPath.split(path.sep);

          return projectPathSplit
            .slice(0, projectPathSplit.length - 2)
            .join(path.sep);
        }
      }
    }

    return workspace.workspaceFolders && workspace.workspaceFolders.length
      ? workspace.workspaceFolders[0].uri.fsPath
      : '';
  }

  private async fromFilepath(
    projectReaders: Array<ProjectReader>
  ): Promise<string> {
    const rootPath = await this.getRootPath(projectReaders);
    const namespaceWithLeadingDot = this.calculateFullNamespace('', rootPath);

    return namespaceWithLeadingDot.slice(1);
  }

  private calculateFullNamespace(
    rootNamespace: string,
    rootDirectory: string
  ): string {
    const filePathSegments: string[] = path
      .dirname(this.filePath)
      .split(path.sep);
    const rootDirSegments: string[] = rootDirectory.split(path.sep);

    let fullNamespace = rootNamespace;

    // Remove rootDirSegments from filePathSegments
    // Then append filePathSegments to full namespace
    for (
      let index = rootDirSegments.length;
      index < filePathSegments.length;
      index++
    ) {
      fullNamespace += '.' + filePathSegments[index];
    }

    return fullNamespace;
  }
}
