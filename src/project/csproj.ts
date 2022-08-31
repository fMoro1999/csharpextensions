export interface Csproj {
  Project: Project | undefined;
}

export interface Project {
  PropertyGroup: Array<PropertyGroup>;
}

export interface PropertyGroup {
  RootNamespace: Array<string> | undefined;
  TargetFramework: Array<string> | undefined;
  ImplicitUsings: Array<string> | undefined;
}
