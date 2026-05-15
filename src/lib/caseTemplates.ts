/**
 * Case templates for pre-filling new cases with scenario-specific defaults.
 */
import type { DFIRData } from "@/features/mia/types";
import type { REData } from "@/features/mre/types";

export interface CaseTemplate {
  id: string;
  nameKey: string;
  descKey: string;
  icon: string;
  forType: "mia" | "mre" | "both";
  fillMIA?: (data: DFIRData) => DFIRData;
  fillMRE?: (data: REData) => REData;
}

export const CASE_TEMPLATES: CaseTemplate[] = [
  {
    id: "blank",
    nameKey: "template.blank",
    descKey: "template.blankDesc",
    icon: "FileText",
    forType: "both",
  },
  {
    id: "ransomware",
    nameKey: "template.ransomware",
    descKey: "template.ransomwareDesc",
    icon: "ShieldAlert",
    forType: "mia",
    fillMIA: (data) => ({
      ...data,
      background: {
        ...data.background,
        infectionVector: data.background.infectionVector || "Phishing email / RDP brute-force",
      },
      impact: {
        ...data.impact,
        riskRating: "critical",
        persistenceLikelihood: "high",
        scopeOfInfection: "Lateral movement detected — assess full network scope",
      },
      recommendations: {
        ...data.recommendations,
        shortTerm: "1. Isolate affected systems immediately\n2. Disable compromised accounts\n3. Preserve forensic evidence (memory dump, disk image)\n4. Check for data exfiltration indicators\n5. Notify incident response team",
        longTerm: "1. Implement network segmentation\n2. Deploy EDR with ransomware-specific rules\n3. Enforce MFA on all remote access\n4. Maintain offline backups with regular restore testing\n5. Conduct user awareness training on phishing",
      },
    }),
  },
  {
    id: "phishing",
    nameKey: "template.phishing",
    descKey: "template.phishingDesc",
    icon: "Mail",
    forType: "mia",
    fillMIA: (data) => ({
      ...data,
      background: {
        ...data.background,
        infectionVector: "Phishing email with malicious attachment/link",
      },
      impact: {
        ...data.impact,
        riskRating: "high",
        scopeOfInfection: "Check for credential compromise and email forwarding rules",
      },
      mitreMapping: {
        ...data.mitreMapping,
        initial_access: [
          { id: "T1566", name: "Phishing" },
          { id: "T1566.001", name: "Spearphishing Attachment" },
          { id: "T1566.002", name: "Spearphishing Link" },
        ],
      },
      recommendations: {
        ...data.recommendations,
        shortTerm: "1. Block sender domain/IP at email gateway\n2. Reset credentials for affected users\n3. Search mailboxes for similar phishing emails\n4. Check for malicious email rules (forwarding, deletion)\n5. Scan endpoints for dropped payloads",
        longTerm: "1. Implement email authentication (SPF, DKIM, DMARC)\n2. Deploy advanced email filtering (sandboxing)\n3. Enable link rewriting and attachment detonation\n4. Conduct regular phishing simulations\n5. Implement conditional access policies",
      },
    }),
  },
  {
    id: "apt",
    nameKey: "template.apt",
    descKey: "template.aptDesc",
    icon: "Crosshair",
    forType: "mia",
    fillMIA: (data) => ({
      ...data,
      impact: {
        ...data.impact,
        riskRating: "critical",
        persistenceLikelihood: "high",
        scopeOfInfection: "Assume full network compromise — check for lateral movement, persistence, and data staging",
      },
      mitreMapping: {
        ...data.mitreMapping,
        command_and_control: [
          { id: "T1071", name: "Application Layer Protocol" },
        ],
        execution: [
          { id: "T1059", name: "Command and Scripting Interpreter" },
        ],
        defense_evasion: [
          { id: "T1055", name: "Process Injection" },
        ],
        persistence: [
          { id: "T1053", name: "Scheduled Task/Job" },
        ],
      },
      recommendations: {
        ...data.recommendations,
        shortTerm: "1. Engage incident response team immediately\n2. Preserve all logs (network, endpoint, authentication)\n3. Identify and isolate C2 communication channels\n4. Check for scheduled tasks, services, and registry persistence\n5. Memory analysis for injected processes",
        longTerm: "1. Deploy network detection and response (NDR)\n2. Implement threat hunting program\n3. Enhance logging and SIEM coverage\n4. Conduct purple team exercises\n5. Establish threat intelligence sharing agreements",
      },
    }),
  },
  {
    id: "infostealer",
    nameKey: "template.infoStealer",
    descKey: "template.infoStealerDesc",
    icon: "KeyRound",
    forType: "mre",
    fillMRE: (data) => ({
      ...data,
      detection: {
        ...data.detection,
        summary: {
          ...data.detection.summary,
          keyFunctionality: data.detection.summary.keyFunctionality || "Credential and data theft",
          purpose: data.detection.summary.purpose || "Steal browser credentials, cookies, crypto wallets, and saved passwords",
        },
      },
    }),
  },
  {
    id: "custom",
    nameKey: "template.custom",
    descKey: "template.customDesc",
    icon: "Pencil",
    forType: "both",
  },
];

export function getTemplatesForType(type: "mia" | "mre"): CaseTemplate[] {
  return CASE_TEMPLATES.filter((t) => t.forType === "both" || t.forType === type);
}
