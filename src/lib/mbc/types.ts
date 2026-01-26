// Malware Behavior Catalog (MBC) Types
// Source: https://github.com/MBCProject/mbc-markdown

export interface MBCMethod {
  id: string;
  name: string;
  description?: string;
}

export interface MBCBehavior {
  id: string;
  name: string;
  description: string;
  attackMapping: string | null;
  attackUrl?: string;
  pathToMd: string;
  methods?: MBCMethod[];
}

export interface MBCObjective {
  objectiveId: string;
  objectiveName: string;
  description: string;
  behaviors: MBCBehavior[];
}

export interface MBCMicroBehavior {
  id: string;
  name: string;
  objective: string;
  pathToMd: string;
}

export interface MBCMicroObjective {
  objectiveId: string;
  objectiveName: string;
  description: string;
  behaviors: MBCMicroBehavior[];
}

export interface MBCData {
  version: string;
  objectives: MBCObjective[];
  microObjectives: MBCMicroObjective[];
}

export const MBC_BASE_URL = "https://github.com/MBCProject/mbc-markdown/blob/main";
