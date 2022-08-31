import Template from './template';

export default class ReswTemplate extends Template {
  constructor(name: string, command: string) {
    super(name, command);
  }

  protected getExtensions(): string[] {
    return ['.resw'];
  }

  protected getOptionalUsings(): string[] {
    return [];
  }

  public async create(
    templatesPath: string,
    pathWithoutExtension: string,
    filename: string
  ): Promise<void> {
    const templatePath = this._getTemplatePath(
      templatesPath,
      this._getFileName()
    );
    const filePath = `${pathWithoutExtension}.resw`;

    await this._createFile(templatePath, filePath, filename);
  }
}
