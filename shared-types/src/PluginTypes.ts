export interface CombinedPluginManifest {
  Author: string;
  Name: string;
  InternalName: string;
  Punchline: string;
  Description: string;
  IconUrl: string;
  ApplicableVersion: string;
  RepoUrl: string;
  Tags: string[];
  DalamudApiLevel: number;
  AssemblyVersion: string;
  DownloadLinkInstall: string;
  DownloadLinkUpdate: string;
  TestingDalamudApiLevel?: number;
  TestingAssemblyVersion?: string;
  DownloadLinkTesting?: string;
  DownloadCount: number;
  LastUpdated: number;
  TestingLastUpdated?: number;
  [key: string]: any;
}
