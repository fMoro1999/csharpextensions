import * as vscode from 'vscode';

import { EOL } from 'os';
import * as path from 'path';

import CodeActionProvider from './codeActionProvider';
import { RegisterCommandCallbackArgument } from './models';
import CSharpTemplate from './template/csharpTemplate';
import Template from './template/template';
import { showAndLogErrorMessage } from './utils';

export function activate(context: vscode.ExtensionContext): void {
  const documentSelector: vscode.DocumentSelector = {
    language: 'csharp',
    scheme: 'file',
  };
  const codeActionProvider = new CodeActionProvider();
  const disposable = vscode.languages.registerCodeActionsProvider(
    documentSelector,
    codeActionProvider
  );

  const extension = Extension.getInstance();
  const knownTemplates = Extension.getknownTemplates();

  knownTemplates.forEach((template) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        template.command,
        async (options: RegisterCommandCallbackArgument) =>
          await extension.createFromTemplate(options, template)
      )
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  /* Nothing to do here */
}

export class Extension {
  private constructor() {
    /**/
  }

  private getIncomingPath(
    options: RegisterCommandCallbackArgument
  ): string | undefined {
    if (options) {
      return options._fsPath || options.fsPath || options.path;
    }

    const incomingPath =
      vscode.workspace.workspaceFolders &&
      vscode.workspace.workspaceFolders.length
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;

    return incomingPath;
  }

  public async createFromTemplate(
    options: RegisterCommandCallbackArgument,
    template: Template
  ): Promise<void> {
    const incomingPath = this.getIncomingPath(options);

    if (!incomingPath) {
      vscode.window.showErrorMessage(
        `Could not find the path for this action.${EOL}` +
          'If this problem persists, please create an issue in the github repository.'
      );

      return;
    }

    const extension = Extension.GetCurrentVscodeExtension();

    if (!extension) {
      vscode.window.showErrorMessage(
        'Weird, but the extension you are currently using could not be found'
      );

      return;
    }

    let newFilename = await vscode.window.showInputBox({
      ignoreFocusOut: true,
      prompt: 'Please enter a name for the new file(s)',
      value: `${template.name}`,
    });

    if (!newFilename) {
      console.info('Filename request: User did not provide any input');

      return;
    }

    if (newFilename.endsWith('.cs')) {
      newFilename = newFilename.substring(0, newFilename.length - 3);
    }

    const pathWithoutExtension = `${incomingPath}${path.sep}${newFilename}`;
    const existingFiles = await template.getExistingFiles(pathWithoutExtension);

    if (existingFiles.length) {
      vscode.window.showErrorMessage(
        `File(s) already exists: ${EOL}${existingFiles.join(EOL)}`
      );

      return;
    }

    const templatesPath = path.join(
      extension.extensionPath,
      Extension.templatesPath
    );

    try {
      await template.create(templatesPath, pathWithoutExtension, newFilename);
    } catch (errCreating) {
      const message =
        `Error trying to create new ${template.name}` +
        ` at ${pathWithoutExtension}`;

      showAndLogErrorMessage(message, errCreating);
    }
  }

  private static templatesPath = 'templates';
  private static knownTemplates: Map<string, Template>;
  private static currentVscodeExtension: vscode.Extension<unknown> | undefined =
    undefined;
  private static instance: Extension;
  private static KnownExtensionNames = [
    'kreativ-software.csharpextensions',
    'jsw.csharpextensions',
  ];

  public static getInstance(): Extension {
    if (!this.instance) {
      this.instance = new Extension();
    }

    return this.instance;
  }

  private static GetCurrentVscodeExtension():
    | vscode.Extension<unknown>
    | undefined {
    if (this.currentVscodeExtension) {
      return this.currentVscodeExtension;
    }

    for (let i = 0; i < this.KnownExtensionNames.length; i++) {
      const extension = vscode.extensions.getExtension(
        this.KnownExtensionNames[i]
      );

      if (extension) {
        this.currentVscodeExtension = extension;
        break;
      }
    }

    return this.currentVscodeExtension;
  }

  static getknownTemplates(): Map<string, Template> {
    if (this.knownTemplates) {
      return this.knownTemplates;
    }

    this.knownTemplates = new Map()
      .set('class', new CSharpTemplate('Class', 'createClass'))
      .set('interface', new CSharpTemplate('Interface', 'createInterface'))
      .set('enum', new CSharpTemplate('Enum', 'createEnum'))
      .set(
        'apicontroller',
        new CSharpTemplate('ApiController', 'createApiController', [
          'Microsoft.AspNetCore.Mvc',
          'Microsoft.Extensions.Logging',
        ])
      )
      .set('xunit', new CSharpTemplate('XUnit', 'createXUnitTest', ['XUnit']));

    return this.knownTemplates;
  }
}
