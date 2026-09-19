"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useBroke } from "./store";
import type { Currency } from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string) => UUID.test(s);

/**
 * Cloud sync (Supabase). Local-first: if no client/user, everything stays on-device.
 * Synced: profile, transactions, budgets, savings_goals (+ goal_contributions on contribute is local-only for v1).
 * Groups/splits stay local in v1 (shared-group semantics need invites — roadmap).
 */

export async function pullCloud(sb: SupabaseClient, userId: string) {
  const importCloud = useBroke.getState().importCloud;
  const [prof, txns, budgets, goals] = await Promise.all([
    sb.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    sb.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(500),
    sb.from("budgets").select("*").eq("user_id", userId).limit(50),
    sb.from("savings_goals").select("*").eq("user_id", userId).limit(50),
  ]);
  if (prof.error) throw prof.error;

  importCloud({
    profile: prof.data
      ? {
          name: prof.data.name ?? "",
          currency: (prof.data.currency ?? "INR") as Currency,
          monthlyIncome: Number(prof.data.monthly_income ?? 0),
          nextIncomeDate: prof.data.next_income_date ?? "2026-10-05",
          onboarded: true,
        }
      : { onboarded: useBroke.getState().profile.onboarded },
    transactions: (txns.data ?? []).map((t: Record<string, unknown>) => ({
      id: String(t.id),
      type: t.type as "expense" | "income",
      amount: Number(t.amount),
      category: String(t.category ?? "Other"),
      note: String(t.note ?? ""),
      date: String(t.date ?? new Date().toISOString()),
      paymentMethod: String((t as Record<string, unknown>).payment_method ?? "UPI"),
      recurring: Boolean(t.recurring),
    })),
    budgets: (budgets.data ?? []).map((b: Record<string, unknown>) => ({
      id: String(b.id),
      scope: (b.scope as "monthly" | "weekly") ?? "monthly",
      category: String(b.category ?? "TOTAL"),
      limit: Number((b as Record<string, unknown>).limit_amount ?? 0),
      periodKey: String((b as Record<string, unknown>).period_key ?? ""),
    })),
    goals: (goals.data ?? []).map((g: Record<string, unknown>) => ({
      id: String(g.id),
      name: String(g.name ?? "Goal"),
      kind: String(g.kind ?? "Other"),
      target: Number(g.target ?? 0),
      saved: Number(g.saved ?? 0),
      targetDate: (g.target_date as string) ?? undefined,
      createdAt: String((g as Record<string, unknown>).created_at ?? new Date().toISOString()),
    })),
  });
}

export async function pushCloud(sb: SupabaseClient, userId: string) {
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
  if (pErr) throw pErr;

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
    };
    if (isUuid(t.id)) {
      const { error } = await sb.from("transactions").upsert({ id: t.id, ...row }, { onConflict: "id" });
      if (error) throw error;
    } else {
      const { data, error } = await sb.from("transactions").insert(row).select("id").single();
      if (error) throw error;
      if (data?.id) s.remapId("txn", t.id, String(data.id));
    }
  }

  for (const b of s.budgets) {
    const row = { user_id: userId, scope: b.scope, category: b.category, limit_amount: b.limit, period_key: b.periodKey };
    if (isUuid(b.id)) {
      const { error } = await sb.from("budgets").upsert({ id: b.id, ...row }, { onConflict: "id" });
      if (error) throw error;
    } else {
      const { data, error } = await sb.from("budgets").insert(row).select("id").single();
      if (error) throw error;
      if (data?.id) s.remapId("bud", b.id, String(data.id));
    }
  }

  for (const g of s.goals) {
    const row = { user_id: userId, name: g.name, kind: g.kind, target: g.target, saved: g.saved, target_date: g.targetDate ?? null };
    if (isUuid(g.id)) {
      const { error } = await sb.from("savings_goals").upsert({ id: g.id, ...row }, { onConflict: "id" });
      if (error) throw error;
    } else {
      const { data, error } = await sb.from("savings_goals").insert(row).select("id").single();
      if (error) throw error;
      if (data?.id) s.remapId("goal", g.id, String(data.id));
    }
  }
}
