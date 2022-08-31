import Template from './template';

export default class CshtmlTemplate extends Template {
  constructor(
    name: string,
    command: string,
    requiredUsings: string[] = [
      'Microsoft.AspNetCore.Mvc',
      'Microsoft.AspNetCore.Mvc.RazorPages',
      'Microsoft.Extensions.Logging',
    ]
  ) {
    super(name, command, requiredUsings);
  }

  protected getExtensions(): string[] {
    return ['.cshtml', '.cshtml.cs'];
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
    const cshtmlTemplatePath = this._getTemplatePath(
      templatesPath,
      this._getFileName()
    );
    const csTemplatePath = this._getTemplatePath(
      templatesPath,
      `${this._getFileName()}.cs`
    );
    const cshtmlFilePath = `${pathWithoutExtension}.cshtml`;
    const csFilePath = `${pathWithoutExtension}.cshtml.cs`;

    await this._createFile(csTemplatePath, csFilePath, filename);
    await this._createFile(cshtmlTemplatePath, cshtmlFilePath, filename);
  }
}
