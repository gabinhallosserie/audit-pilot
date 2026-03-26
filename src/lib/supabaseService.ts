import { supabase } from "@/integrations/supabase/client";
import type { Finding, FindingType } from "@/data/mockData";

// ─── Audits ───
export async function fetchAudits() {
  const { data, error } = await supabase.from("audits").select("*").order("date", { ascending: false });
  if (error) throw error;
  return data;
}

// ─── Missions ───
export async function fetchMissions() {
  const { data, error } = await supabase.from("missions").select("*").order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchMission(id: string) {
  const { data, error } = await supabase.from("missions").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function fetchMissionByAuditId(auditId: string) {
  const { data, error } = await supabase.from("missions").select("*").eq("audit_id", auditId).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateMissionStatus(id: string, status: string) {
  const { error } = await supabase.from("missions").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateMissionPlanValidated(id: string, validated: boolean) {
  const { error } = await supabase.from("missions").update({ plan_validated: validated }).eq("id", id);
  if (error) throw error;
}

export async function updateMissionNotes(id: string, notes: string) {
  const { error } = await supabase.from("missions").update({ notes }).eq("id", id);
  if (error) throw error;
}

// ─── Findings ───
export async function fetchFindings(missionId: string) {
  const { data, error } = await supabase.from("findings").select("*").eq("mission_id", missionId).order("created_at");
  if (error) throw error;
  return data;
}

export async function insertFinding(finding: { id: string; mission_id: string; type: string; clause: string; description: string; evidence: string }) {
  const { error } = await supabase.from("findings").insert(finding);
  if (error) throw error;
}

export async function deleteFinding(id: string) {
  const { error } = await supabase.from("findings").delete().eq("id", id);
  if (error) throw error;
}

// ─── Checklist ───
export async function fetchChecklist(missionId: string) {
  const { data, error } = await supabase.from("checklist_items").select("*").eq("mission_id", missionId).order("clause");
  if (error) throw error;
  return data;
}

export async function updateChecklistItem(id: string, checked: boolean) {
  const { error } = await supabase.from("checklist_items").update({ checked }).eq("id", id);
  if (error) throw error;
}

// ─── Audit Plan Processes ───
export async function fetchProcesses(missionId: string) {
  const { data, error } = await supabase
    .from("audit_plan_processes")
    .select("*, process_checklist_items(*)")
    .eq("mission_id", missionId)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function insertProcess(process: { id: string; mission_id: string; name: string; responsible: string; date: string | null; duration: string }) {
  const { error } = await supabase.from("audit_plan_processes").insert(process);
  if (error) throw error;
}

export async function deleteProcess(id: string) {
  const { error } = await supabase.from("audit_plan_processes").delete().eq("id", id);
  if (error) throw error;
}

export async function insertProcessChecklistItems(items: { id: string; process_id: string; label: string; checked: boolean }[]) {
  const { error } = await supabase.from("process_checklist_items").insert(items);
  if (error) throw error;
}

export async function updateProcessChecklistItem(id: string, checked: boolean) {
  const { error } = await supabase.from("process_checklist_items").update({ checked }).eq("id", id);
  if (error) throw error;
}

// ─── Opening Report ───
export async function fetchOpeningReport(missionId: string) {
  const { data, error } = await supabase.from("opening_reports").select("*").eq("mission_id", missionId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateOpeningReport(missionId: string, updates: { perimetre?: string; remarques?: string; agenda?: string[]; mission_started?: boolean }) {
  const { error } = await supabase.from("opening_reports").update(updates).eq("mission_id", missionId);
  if (error) throw error;
}

// ─── Opening Participants ───
export async function fetchParticipants(missionId: string) {
  const { data, error } = await supabase.from("opening_participants").select("*").eq("mission_id", missionId);
  if (error) throw error;
  return data;
}

export async function insertParticipant(participant: { id: string; mission_id: string; name: string; role: string; organisation: string }) {
  const { error } = await supabase.from("opening_participants").insert(participant);
  if (error) throw error;
}

export async function deleteParticipant(id: string) {
  const { error } = await supabase.from("opening_participants").delete().eq("id", id);
  if (error) throw error;
}
