import type { WorkspaceState, Skill } from "@/lib/types";
export const subskills: Record<string, string[]> = { Networking: ["TCP/IP", "DNS", "Routing", "Subnetting", "Nmap", "Wireshark"], "Pentest Workflow": ["Recon", "Enumeration", "Exploitation"], Linux: ["Bash", "Permissions", "Processes"], "Web Security": ["HTTP", "XSS", "SQL", "Access Control"], "Active Directory": ["Kerberos", "LDAP", "SMB"], "Python/Bash": ["Python", "Bash", "Scripts"], Reporting: ["Evidence", "Impact", "Remediation"] };
const normalize = (value: string) => value.toLocaleLowerCase("tr").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const aliases: Record<string,string[]> = { Networking: ["network", "ag", "networking"], "Pentest Workflow": ["pentesting", "pentest workflow", "sızma testi"], "Web Security": ["web", "web guvenligi", "web security"], Reporting: ["raporlama", "reporting"], "Python/Bash": ["python/bash"], Linux: ["linux"] };
export function skillEvidence(w: WorkspaceState, s: Skill) {
  const related = (category: string) => [s.name, s.category, ...(aliases[s.name] ?? [])].map(normalize).includes(normalize(category));
  const labs = w.labs.filter(l => l.status !== "planned" && (l.skillsGained?.includes(s.name) || related(l.category)));
  const tasks = w.tasks.filter(t => t.status === "completed" && related(t.category));
  const notes = w.notes.filter(n => n.linkedSkill === s.name || related(n.category));
  const projects = w.portfolio.filter(p => p.skills.includes(s.name));
  const reports = s.name === "Reporting" ? w.reports : [];
  const dates = [...labs.map(l => l.date), ...tasks.map(t => t.completedAt), ...notes.map(n => n.updatedAt), ...projects.map(p => p.lastCommitAt), ...reports.map(r => r.updatedAt)].filter((d): d is string => !!d && Number.isFinite(Date.parse(d))).sort((a,b) => Date.parse(b)-Date.parse(a));
  return { labs, tasks, notes, projects, reports, count: labs.length + tasks.length + notes.length + projects.length + reports.length, lastPracticed: dates[0] };
}
