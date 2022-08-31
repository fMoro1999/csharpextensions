import { Uri, workspace } from 'vscode';
import { Parser } from 'xml2js';

import { Csproj, PropertyGroup } from './csproj';
import ProjectReader from './projectReader';

export default class CsprojReader extends ProjectReader {
  private readonly xmlParser: Parser;

  /**
   * Initializes a new instance for a .csproj-file
   *
   * @param filePath - The path to the .csproj-file
   */
  constructor(filePath: string) {
    super(filePath);
    //TODO: Check if csproj
    this.xmlParser = new Parser();
  }

  /**
   * @inheritdoc
   */
  public async getRootNamespace(): Promise<string | undefined> {
    try {
      const propertyGroups = await this.getPropertyGroups();
      const propertyGroupWithRootNamespace = propertyGroups?.find(
        (p) => p.RootNamespace
      );

      if (!propertyGroupWithRootNamespace?.RootNamespace) return;

      return propertyGroupWithRootNamespace.RootNamespace[0];
    } catch (errParsingXml) {
      console.error('Error parsing project xml', errParsingXml);
    }

    return;
  }

  /**
   * Finds and returns the first TargetFramework of this project file
   *
   * @returns The first found TargetFramework of this project file, or undefined
   */
  public async getTargetFramework(): Promise<string | undefined> {
    try {
      const propertyGroups = await this.getPropertyGroups();
      const propertyGroupWithTargetFramework = propertyGroups?.find(
        (p) => p.TargetFramework
      );

      if (!propertyGroupWithTargetFramework?.TargetFramework) return;

      return propertyGroupWithTargetFramework.TargetFramework[0];
    } catch (errParsingXml) {
      console.error('Error parsing project xml', errParsingXml);
    }

    return;
  }

  /**
   * If the target framework for this .csproj is >= .net6.0
   *
   * @returns If the target framework for this .csproj is >= .net6.0, undefined if no target framework is found
   */
  public async isTargetFrameworkHigherThanOrEqualToDotNet6(): Promise<
    boolean | undefined
    // eslint-disable-next-line indent
  > {
    const targetFramework = await this.getTargetFramework();

    if (!targetFramework) return; // No target framework found

    const versionMatch = targetFramework.match(/(?<=net)\d+(\.\d+)*/i); // Match .NET version string like "net6.0"

    if (!versionMatch?.length || Number.isNaN(versionMatch[0])) return false;

    return Number(versionMatch[0]) >= 6;
  }

  /**
   * Retrieve the content of this project file
   *
   * @returns The content of this project file
   */
  protected async getContent(): Promise<string> {
    const document = await workspace.openTextDocument(Uri.file(this.filePath));

    return document.getText();
  }

  /**
   * Retrieves and parses the content of this project file
   *
   * @returns The parsed xml content of this project file
   */
  protected async getXmlContent(): Promise<Csproj> {
    const content = await this.getContent();

    return await this.xmlParser.parseStringPromise(content);
  }

  /**
   * Retrieves the property groups of this project file
   *
   * @returns The property groups of this project file
   */
  protected async getPropertyGroups(): Promise<PropertyGroup[] | undefined> {
    const xmlContent = await this.getXmlContent();

    return xmlContent?.Project?.PropertyGroup;
  }

  /**
   * Tries to create a new csproj reader from the given path, searched upwards
   *
   * @param findFromPath The path from where to start looking for a .csproj-file
   * @returns A new .csproj-reader if a file is found, or undefined
   */
  public static async createFromPath(
    findFromPath: string
  ): Promise<CsprojReader | undefined> {
    return await this.createProjectFromPath(findFromPath, '*.csproj');
  }
}
