"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useBroke } from "./store";
import type { Budget, Currency, SavingsGoal, Transaction } from "./types";
import { supabaseOrNull } from "./supabase";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UUID.test(s);

/**
 * Cloud sync (Supabase). Local-first: if no client/user, everything stays on-device.
 * Synced: profile, transactions, budgets, savings_goals.
 * Groups/splits stay local in v1 (shared-group semantics need invites — roadmap).
 *
 * Merge rule (never wipe): pull UNIONS cloud + local rows by id. Pushed rows get
 * their local ids remapped to the cloud UUIDs, so re-pull never duplicates.
 * On id conflict (same row edited both places) the LOCAL copy wins — the user
 * just touched it, so it carries intent.
 */

/** Union two row lists by id. `local` wins conflicts. Pure + tested. */
export function unionById<T extends { id: string }>(cloud: T[], local: T[]): T[] {
  const map = new Map<string, T>();
  for (const r of cloud) map.set(r.id, r);
  for (const r of local) map.set(r.id, r);
  return [...map.values()];
}

export async function pullCloud(sb: SupabaseClient, userId: string) {
  const s = useBroke.getState();
  const [prof, txns, budgets, goals] = await Promise.all([
    sb.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    sb.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(500),
    sb.from("budgets").select("*").eq("user_id", userId).limit(50),
    sb.from("savings_goals").select("*").eq("user_id", userId).limit(50),
  ]);
  // Surface EVERY table error (RLS/missing-table bugs hid here silently before).
  for (const [name, r] of [["profiles", prof], ["transactions", txns], ["budgets", budgets], ["savings_goals", goals]] as const) {
    if (r.error) throw new Error(`${name}: ${r.error.message}`);
  }

  const cloudTxns: Transaction[] = (txns.data ?? []).map((t: Record<string, unknown>) => ({
    id: String(t.id),
    type: t.type as "expense" | "income",
    amount: Number(t.amount),
    category: String(t.category ?? "Other"),
    note: String(t.note ?? ""),
    date: String(t.date ?? new Date().toISOString()),
    paymentMethod: String(t.payment_method ?? "UPI"),
    recurring: Boolean(t.recurring),
    merchant: (t.merchant as string) ?? null,
    status: (t.status as string) ?? null,
    transactionId: (t.transaction_id as string) ?? null,
    source: ((t.source as string) ?? "manual") as "manual" | "upi_screenshot" | "other",
  }));
  const cloudBudgets: Budget[] = (budgets.data ?? []).map((b: Record<string, unknown>) => ({
    id: String(b.id),
    scope: (b.scope as "monthly" | "weekly") ?? "monthly",
    category: String(b.category ?? "TOTAL"),
    limit: Number(b.limit_amount ?? 0),
    periodKey: String(b.period_key ?? ""),
  }));
  const cloudGoals: SavingsGoal[] = (goals.data ?? []).map((g: Record<string, unknown>) => ({
    id: String(g.id),
    name: String(g.name ?? "Goal"),
    kind: String(g.kind ?? "Other"),
    target: Number(g.target ?? 0),
    saved: Number(g.saved ?? 0),
    targetDate: (g.target_date as string) ?? undefined,
    createdAt: String(g.created_at ?? new Date().toISOString()),
  }));

  s.importCloud({
    // Cloud profile wins when present; otherwise keep the local one
    // (fresh signup that hasn't pushed yet) — never blank it.
    profile: prof.data
      ? {
          name: prof.data.name ?? "",
          currency: (prof.data.currency ?? "INR") as Currency,
          monthlyIncome: Number(prof.data.monthly_income ?? 0),
          nextIncomeDate: prof.data.next_income_date ?? s.profile.nextIncomeDate,
          onboarded: true,
        }
      : undefined,
    transactions: unionById(cloudTxns, s.transactions).sort((a, b) => (a.date < b.date ? 1 : -1)),
    budgets: unionById(cloudBudgets, s.budgets),
    goals: unionById(cloudGoals, s.goals),
  });
}

let pushInFlight = false;

export async function pushCloud(sb: SupabaseClient, userId: string) {
  if (pushInFlight) return;
  pushInFlight = true;
  try {
    const s = useBroke.getState();
    // profile upsert (no secrets, no bank data — just preferences)
    const { error: pErr } = await sb.from("profiles").upsert(
      {
        user_id: userId,
        name: s.profile.name,
        currency: s.profile.currency,
        monthly_income: s.profile.monthlyIncome,
        next_income_date: s.profile.nextIncomeDate || null,
        savings_goal_name: s.profile.savingsGoalName ?? null,
        onboarded: s.profile.onboarded,
      },
      { onConflict: "user_id" }
    );
    if (pErr) throw new Error(`profiles: ${pErr.message}`);

    // transactions: upsert uuid rows, insert local-id rows then remap
    for (const t of s.transactions.slice(0, 500)) {
      const row = {
        user_id: userId,
        type: t.type,
        amount: t.amount,
        category: t.category,
        note: t.note.slice(0, 500),
        date: t.date,
        payment_method: t.paymentMethod,
        recurring: !!t.recurring,
        merchant: t.merchant ?? null,
        status: t.status ?? null,
        transaction_id: t.transactionId ?? null,
        source: t.source ?? "manual",
      };
      if (isUuid(t.id)) {
        const { error } = await sb.from("transactions").upsert({ id: t.id, ...row }, { onConflict: "id" });
        if (error) throw new Error(`transactions: ${error.message}`);
      } else {
        const { data, error } = await sb.from("transactions").insert(row).select("id").single();
        if (error) throw new Error(`transactions: ${error.message}`);
        if (data?.id) useBroke.getState().remapId("txn", t.id, String(data.id));
      }
    }

    for (const b of s.budgets) {
      const row = { user_id: userId, scope: b.scope, category: b.category, limit_amount: b.limit, period_key: b.periodKey };
      if (isUuid(b.id)) {
        const { error } = await sb.from("budgets").upsert({ id: b.id, ...row }, { onConflict: "id" });
        if (error) throw new Error(`budgets: ${error.message}`);
      } else {
        const { data, error } = await sb.from("budgets").insert(row).select("id").single();
        if (error) throw new Error(`budgets: ${error.message}`);
        if (data?.id) useBroke.getState().remapId("bud", b.id, String(data.id));
      }
    }

    for (const g of s.goals) {
      const row = { user_id: userId, name: g.name, kind: g.kind, target: g.target, saved: g.saved, target_date: g.targetDate ?? null };
      if (isUuid(g.id)) {
        const { error } = await sb.from("savings_goals").upsert({ id: g.id, ...row }, { onConflict: "id" });
        if (error) throw new Error(`savings_goals: ${error.message}`);
      } else {
        const { data, error } = await sb.from("savings_goals").insert(row).select("id").single();
        if (error) throw new Error(`savings_goals: ${error.message}`);
        if (data?.id) useBroke.getState().remapId("goal", g.id, String(data.id));
      }
    }
  } finally {
    pushInFlight = false;
  }
}

/** Manual "sync now" for the status badge retry button. Returns ok/err for UI. */
export async function syncNow(): Promise<{ ok: boolean; message: string }> {
  const sb = supabaseOrNull();
  const { cloud } = useBroke.getState();
  if (!sb) return { ok: false, message: "Supabase keys missing — running local-only." };
  if (!cloud.userId) return { ok: false, message: "Not signed in — log in first." };
  try {
    await pullCloud(sb, cloud.userId);
    await pushCloud(sb, cloud.userId);
    return { ok: true, message: "Synced ☁" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Sync failed." };
  }
}
