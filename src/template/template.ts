import * as vscode from 'vscode';

import { promises as fs } from 'fs';
import { sortBy, uniq } from 'lodash';
import { EOL } from 'os';
import * as path from 'path';

import fileScopedNamespaceConverter from '../fileScopedNamespaceConverter';
import NamespaceDetector from '../namespaceDetector';
import { camelize, ExtensionError, Regexes } from '../utils';

export default abstract class Template {
  name: string;
  private _command: string;
  private requiredUsings: string[];

  constructor(name: string, command: string, requiredUsings: string[] = []) {
    this.name = name;
    this._command = command;
    this.requiredUsings = requiredUsings;
  }

  public get command(): string {
    return `csharpextensions.${this._command}`;
  }

  public async getExistingFiles(
    pathWithoutExtension: string
  ): Promise<string[]> {
    const extensions = this.getExtensions();
    const existingFiles: string[] = [];

    for (let i = 0; i < extensions.length; i++) {
      const fullPath = `${pathWithoutExtension}${extensions[i]}`;

      try {
        await fs.access(fullPath);

        existingFiles.push(fullPath);
      } catch {}
    }

    return existingFiles;
  }

  protected get fileName(): string {
    // Template file names are always in lowercase, but names can have uppercase characters
    return this.name.toLowerCase();
  }

  private async getNamespace(pathWithoutExtension: string): Promise<string> {
    const namespaceDetector = new NamespaceDetector(pathWithoutExtension);

    return await namespaceDetector.getNamespace();
  }

  private getEolSetting(): string {
    const eolSetting = vscode.workspace
      .getConfiguration()
      .get('files.eol', EOL);

    switch (eolSetting) {
      case '\n':
      case '\r\n':
        return eolSetting;
      case 'auto':
      default:
        return EOL;
    }
  }

  protected async createFile(
    templatePath: string,
    filePath: string,
    filename: string
  ): Promise<void> {
    let doc;

    try {
      doc = await fs.readFile(templatePath, 'utf-8');
    } catch (errReading) {
      throw new ExtensionError(
        `Could not read template file from '${templatePath}'`,
        errReading
      );
    }

    let text = doc;
    let cursorPosition: vscode.Position | null;

    try {
      text =
        await fileScopedNamespaceConverter.getFileScopedNamespaceFormOfTemplateIfNecessary(
          text,
          filePath
        );

      const namespace: string = await this.getNamespace(filePath);
      const modelType: string = this.getTypeFromFilename(filename);
      const camelModelType: string = camelize(modelType);
      const eolSetting: string = this.getEolSetting();
      cursorPosition = this.findCursorInTemplate(text);

      text = text
        .replace(Regexes.NAMESPACE_REGEX, namespace)
        .replace(Regexes.CLASS_NAME_REGEX, filename)
        .replace(Regexes.NAMESPACES_REGEX, this.usings)
        .replace(Regexes.TYPE_REGEX, modelType)
        .replace(Regexes.CAMELCASE_TYPE_REGEX, camelModelType)
        .replace('${cursor}', '')
        .replace(Regexes.EOL_REGEX, eolSetting);
        
    } catch (errBuildingText) {
      throw new ExtensionError('Error trying to build text', errBuildingText);
    }

    try {
      await fs.writeFile(filePath, text);
    } catch (errWritingFile) {
      throw new ExtensionError(
        `Error trying to write to '${filePath}'`,
        errWritingFile
      );
    }

    try {
      const openedDoc = await vscode.workspace.openTextDocument(filePath);
      const editor = await vscode.window.showTextDocument(openedDoc);

      if (cursorPosition) {
        const newSelection = new vscode.Selection(
          cursorPosition,
          cursorPosition
        );

        editor.selection = newSelection;
      }
    } catch (errOpeningFile) {
      throw new ExtensionError(
        `Error trying to open from '${filePath}'`,
        errOpeningFile
      );
    }
  }

  /**
   * ItemController -> Item
   * ItemsController -> Item
   *
   * @private
   * @param {string} filename
   * @return {*}
   * @memberof Template
   */
  private getTypeFromFilename(filename: string) {
    return filename.includes('sController')
      ? filename.replace('sController', '')
      : filename.replace('Controller', '');
  }

  protected getTemplatePath(
    templatesPath: string,
    templateName: string
  ): string {
    return path.join(templatesPath, `${templateName}.tmpl`);
  }

  private get usings(): string {
    const usings = this.requiredUsings;

    if (!usings.length) return '';

    const uniqueUsings = uniq(usings);
    const sortedUsings = sortBy(uniqueUsings, [
      (using) => !using.startsWith('System'),
      (using) => using,
    ]);
    const joinedUsings = sortedUsings
      .map((using) => `using ${using};`)
      .join(EOL);

    return `${joinedUsings}${EOL}${EOL}`;
  }

  protected abstract getExtensions(): string[];
  protected abstract getOptionalUsings(): string[];
  public abstract create(
    templatesPath: string,
    pathWithoutExtension: string,
    filename: string
  ): Promise<void>;

  private findCursorInTemplate(text: string): vscode.Position | null {
    const cursorPos = text.indexOf('${cursor}');
    const preCursor = text.substr(0, cursorPos);
    const matchesForPreCursor = preCursor.match(/\n/gi);

    if (matchesForPreCursor === null) return null;

    const lineNum = matchesForPreCursor.length;
    const charNum = preCursor.substr(preCursor.lastIndexOf('\n')).length;

    return new vscode.Position(lineNum, charNum);
  }
}
