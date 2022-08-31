import Template from './template';

export default class CSharpTemplate extends Template {
  constructor(name: string, command: string, requiredUsings: string[] = []) {
    super(name, command, requiredUsings);
  }

  protected getExtensions(): string[] {
    return ['.cs'];
  }

  protected getOptionalUsings(): string[] {
    return [
      'System',
      'System.Collections.Generic',
      'System.Linq',
      'System.Threading.Tasks',
    ];
  }

  public async create(
    templatesPath: string,
    pathWithoutExtension: string,
    filename: string
  ): Promise<void> {
    const templatePath = this.getTemplatePath(
      templatesPath,
      this.fileName
    );
    const filePath = this.buildPath(pathWithoutExtension);

    await this.createFile(templatePath, filePath, filename);
  }

  private buildPath(pathWithoutExtension: string) {
    return `${pathWithoutExtension}.cs`;
  }
}
