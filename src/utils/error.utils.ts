import { window } from 'vscode';

export function showAndLogErrorMessage(
  errorMessage: string,
  error: object | string | unknown | undefined
) {
  if (error) {
    const errLog: { error: unknown; internalError: unknown } = {
      error,
      internalError: undefined,
    };

    if (error instanceof ExtensionError) {
      errLog.internalError = (error as ExtensionError).getInternalError();
    }

    console.error(errorMessage, errLog);

    window.showErrorMessage(
      `${errorMessage} - See extension log for more info`
    );
  } else {
    console.error(errorMessage);

    window.showErrorMessage(errorMessage);
  }
}

export class ExtensionError extends Error {
  protected internalError: Error | unknown | undefined;

  constructor(
    message: string,
    internalError: Error | unknown | undefined = undefined
  ) {
    super(message);

    this.internalError = internalError;
  }

  public getInternalError(): Error | unknown | undefined {
    return this.internalError;
  }
}
