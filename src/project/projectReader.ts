import * as path from 'path';
import * as findupglob from 'find-up-glob';

export default abstract class ProjectReader {
  protected readonly filePath: string;

  /**
   * Create a new project reader
   *
   * @param filePath The path to the project file
   */
  constructor(filePath: string) {
    this.filePath = filePath; //TODO: Check if exists
  }

  /**
   * Retrieve the set file path for this project reader
   *
   * @returns The set file path for this project reader
   */
  public getFilePath(): string {
    return this.filePath;
  }

  /**
   * Finds and returns the first RootNamespace of this project file
   *
   * @returns The first found RootNamespace of this project file, or undefined
   */
  public abstract getRootNamespace(): Promise<string | undefined>;

  /**
   * Tries to create a new project reader from the given path, searched upwards, with the given file patterns to match
   *
   * @param this The class on which this function is executed, from which a new instance should be created
   * @param findFromPath The path from where to start looking for a project file
   * @param filePatterns The file patterns to match with
   * @returns A new project reader if a file is found, or undefined
   */
  protected static async createProjectFromPath<T extends ProjectReader>(
    this: new (filePath: string) => T,
    findFromPath: string,
    ...filePatterns: Array<string>
  ): Promise<T | undefined> {
    const projectPath = await ProjectReader.findProjectPath(
      findFromPath,
      ...filePatterns
    );

    return projectPath ? new this(projectPath) : undefined;
  }

  /**
   * Finds the nearest path for a project file upwards from the given 'fromPath'
   *
   * @param fromPath The path from where to start looking for a project file
   * @param filePatterns The file patterns to search with
   * @returns The found path, or undefined
   */
  public static async findProjectPath(
    fromPath: string,
    ...filePatterns: Array<string>
  ): Promise<string | undefined> {
    if (!filePatterns?.length) return;

    const filePattern = filePatterns[0];
    const projectPaths: string[] = await findupglob(filePattern, {
      cwd: path.dirname(fromPath),
    });

    if (projectPaths?.length) return projectPaths[0];

    return await this.findProjectPath(fromPath, ...filePatterns.splice(1));
  }
}
