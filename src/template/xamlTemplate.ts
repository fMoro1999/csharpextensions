import Template from './template';

export default class XamlTemplate extends Template {
  constructor(name: string, command: string, requiredUsings: string[] = []) {
    super(name, command, requiredUsings);
  }

  public getExtensions(): string[] {
    return ['.xaml', '.xaml.cs'];
  }

  protected getOptionalUsings(): string[] {
    return [
      'System',
      'System.Collections.Generic',
      'System.Linq',
      'System.Text',
      'System.Threading.Tasks',
      'System.Windows',
      'System.Windows.Controls',
      'System.Windows.Data',
      'System.Windows.Documents',
      'System.Windows.Input',
      'System.Windows.Media',
      'System.Windows.Media.Imaging',
      'System.Windows.Navigation',
      'System.Windows.Shapes',
    ];
  }

  public async create(
    templatesPath: string,
    pathWithoutExtension: string,
    filename: string
  ): Promise<void> {
    const xamlTemplatePath = this._getTemplatePath(
      templatesPath,
      this._getFileName()
    );
    const csTemplatePath = this._getTemplatePath(
      templatesPath,
      `${this._getFileName()}.cs`
    );
    const xamlFilePath = `${pathWithoutExtension}.xaml`;
    const csFilePath = `${pathWithoutExtension}.xaml.cs`;

    await this._createFile(csTemplatePath, csFilePath, filename);
    await this._createFile(xamlTemplatePath, xamlFilePath, filename);
  }
}
