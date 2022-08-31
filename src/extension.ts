import * as vscode from 'vscode';

import { EOL } from 'os';
import * as path from 'path';

import CodeActionProvider from './codeActionProvider';
import CshtmlTemplate from './template/cshtmlTemplate';
import CsTemplate from './template/csTemplate';
import ReswTemplate from './template/reswTemplate';
import Template from './template/template';
import XamlTemplate from './template/xamlTemplate';
import { showAndLogErrorMessage } from './util';

export function activate(context: vscode.ExtensionContext): void {
  const extension = Extension.getInstance();

  Extension.GetKnownTemplates().forEach((template) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        template.getCommand(),
        async (options: RegisterCommandCallbackArgument) =>
          await extension.createFromTemplate(options, template)
      )
    );
  });

  const documentSelector: vscode.DocumentSelector = {
    language: 'csharp',
    scheme: 'file',
  };
  const codeActionProvider = new CodeActionProvider();
  const disposable = vscode.languages.registerCodeActionsProvider(
    documentSelector,
    codeActionProvider
  );

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  /* Nothing to do here */
}

export class Extension {
  private constructor() {
    /**/
  }

  private _getIncomingPath(
    options: RegisterCommandCallbackArgument
  ): string | undefined {
    if (options) {
      return options._fsPath || options.fsPath || options.path;
    }

    return vscode.workspace.workspaceFolders &&
      vscode.workspace.workspaceFolders.length
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;
  }

  public async createFromTemplate(
    options: RegisterCommandCallbackArgument,
    template: Template
  ): Promise<void> {
    const incomingPath = this._getIncomingPath(options);

    if (!incomingPath) {
      vscode.window.showErrorMessage(
        `Could not find the path for this action.${EOL}If this problem persists, please create an issue in the github repository.`
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
      value: `New${template.getName()}`,
    });

    if (typeof newFilename === 'undefined' || newFilename === '') {
      console.info('Filename request: User did not provide any input');

      return;
    }

    if (newFilename.endsWith('.cs'))
      newFilename = newFilename.substring(0, newFilename.length - 3);

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
      Extension.TemplatesPath
    );

    try {
      await template.create(templatesPath, pathWithoutExtension, newFilename);
    } catch (errCreating) {
      const message = `Error trying to create new ${template.getName()} at ${pathWithoutExtension}`;

      showAndLogErrorMessage(message, errCreating);
    }
  }

  private static TemplatesPath = 'templates';
  private static KnownTemplates: Map<string, Template>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static CurrentVscodeExtension: vscode.Extension<any> | undefined =
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
    if (!this.CurrentVscodeExtension) {
      for (let i = 0; i < this.KnownExtensionNames.length; i++) {
        const extension = vscode.extensions.getExtension(
          this.KnownExtensionNames[i]
        );

        if (extension) {
          this.CurrentVscodeExtension = extension;

          break;
        }
      }
    }

    return this.CurrentVscodeExtension;
  }

  static GetKnownTemplates(): Map<string, Template> {
    if (!this.KnownTemplates) {
      this.KnownTemplates = new Map();

      this.KnownTemplates.set('class', new CsTemplate('Class', 'createClass'));
      this.KnownTemplates.set(
        'interface',
        new CsTemplate('Interface', 'createInterface')
      );
      this.KnownTemplates.set('enum', new CsTemplate('Enum', 'createEnum'));
      this.KnownTemplates.set(
        'struct',
        new CsTemplate('Struct', 'createStruct')
      );
      this.KnownTemplates.set(
        'controller',
        new CsTemplate('Controller', 'createController', [
          'System.Diagnostics',
          'Microsoft.AspNetCore.Mvc',
          'Microsoft.Extensions.Logging',
        ])
      );
      this.KnownTemplates.set(
        'apicontroller',
        new CsTemplate('ApiController', 'createApiController', [
          'Microsoft.AspNetCore.Mvc',
        ])
      );
      this.KnownTemplates.set(
        'razor_page',
        new CshtmlTemplate('Razor_Page', 'createRazorPage', [
          'Microsoft.AspNetCore.Mvc',
          'Microsoft.AspNetCore.Mvc.RazorPages',
          'Microsoft.Extensions.Logging',
        ])
      );
      this.KnownTemplates.set(
        'xunit',
        new CsTemplate('XUnit', 'createXUnitTest', ['XUnit'])
      );
      this.KnownTemplates.set(
        'nunit',
        new CsTemplate('NUnit', 'createNUnitTest', ['NUnit.Framework'])
      );
      this.KnownTemplates.set(
        'mstest',
        new CsTemplate('MSTest', 'createMSTest', [
          'Microsoft.VisualStudio.TestTools.UnitTesting',
        ])
      );
      this.KnownTemplates.set(
        'uwp_page',
        new XamlTemplate('UWP_Page', 'createUwpPage')
      );
      this.KnownTemplates.set(
        'uwp_window',
        new XamlTemplate('UWP_Window', 'createUwpWindow')
      );
      this.KnownTemplates.set(
        'uwp_usercontrol',
        new XamlTemplate('UWP_UserControl', 'createUwpUserControl')
      );
      this.KnownTemplates.set(
        'uwp_resource',
        new ReswTemplate('UWP_Resource', 'createUwpResourceFile')
      );
    }

    return this.KnownTemplates;
  }
}

interface RegisterCommandCallbackArgument {
  _fsPath: string;
  fsPath: string;
  path: string;
}
