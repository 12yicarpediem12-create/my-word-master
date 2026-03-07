export type ActivitySource = {
  created_at?: string | null;
  last_reviewed?: string | null;
  next_review_date?: string | null;
};

export type ActivitySummary = {
  streak: number;
  dueTodayCount: number;
  overdueCount: number;
  lastActivityLabel: string | null;
  activeToday: boolean;
  activeYesterday: boolean;
  activeDays: number;
  doneToday: boolean;
};

export type HabitNudge = {
  eyebrow: string;
  title: string;
  description: string;
  tone: "gray" | "blue" | "amber" | "emerald";
};

function toDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

export function summarizeActivity(items: ActivitySource[], now = new Date()): ActivitySummary {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const counts: Record<string, number> = {};
  let latestActivityMs = 0;
  let dueTodayCount = 0;
  let overdueCount = 0;

  items.forEach((item) => {
    const activityDateStr = item.last_reviewed || item.created_at;
    if (activityDateStr) {
      const activityMs = new Date(activityDateStr).getTime();
      if (activityMs > latestActivityMs) latestActivityMs = activityMs;
      const key = activityDateStr.split("T")[0];
      counts[key] = (counts[key] || 0) + 1;
    }

    if (item.next_review_date) {
      const reviewDate = new Date(item.next_review_date);
      if (reviewDate <= now) dueTodayCount++;
      if (reviewDate < todayStart) overdueCount++;
    }
  });

  const todayStr = toDateKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toDateKey(yesterday);

  let streak = 0;
  let checkDate = new Date(now);

  if (counts[todayStr]) {
    while (true) {
      const key = toDateKey(checkDate);
      if (counts[key]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else if (counts[yesterdayStr]) {
    checkDate = yesterday;
    while (true) {
      const key = toDateKey(checkDate);
      if (counts[key]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    streak,
    dueTodayCount,
    overdueCount,
    lastActivityLabel:
      latestActivityMs > 0
        ? new Date(latestActivityMs).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : null,
    activeToday: Boolean(counts[todayStr]),
    activeYesterday: Boolean(counts[yesterdayStr]),
    activeDays: Object.keys(counts).length,
    doneToday: Boolean(counts[todayStr]) && dueTodayCount === 0,
  };
}

export function getHabitNudge(summary: ActivitySummary, totalWords: number): HabitNudge {
  if (totalWords === 0) {
    return {
      eyebrow: "Start Light",
      title: "Add a few words to begin your daily rhythm.",
      description: "Even a short list is enough to start building a review habit.",
      tone: "gray",
    };
  }

  if (summary.doneToday) {
    return {
      eyebrow: "Done",
      title: "You are done for today.",
      description: "Today’s due review is complete. Come back tomorrow or run an optional refresh session.",
      tone: "emerald",
    };
  }

  if (summary.overdueCount > 0) {
    return {
      eyebrow: "Recovery",
      title: `You have ${summary.overdueCount} overdue ${summary.overdueCount === 1 ? "card" : "cards"}.`,
      description: "A short catch-up session is the fastest way to get back into rhythm.",
      tone: "amber",
    };
  }

  if (summary.dueTodayCount > 0 && !summary.activeToday) {
    return {
      eyebrow: "Today",
      title: `Keep momentum with ${summary.dueTodayCount} due ${summary.dueTodayCount === 1 ? "card" : "cards"}.`,
      description: "One review block now keeps tomorrow lighter.",
      tone: "blue",
    };
  }

  if (summary.activeToday && summary.streak >= 3) {
    return {
      eyebrow: "Momentum",
      title: `${summary.streak}-day streak is active.`,
      description: "A small check-in today is already paying off.",
      tone: "emerald",
    };
  }

  if (summary.lastActivityLabel) {
    return {
      eyebrow: "Return",
      title: `Last active on ${summary.lastActivityLabel}.`,
      description: "A quick session is enough to get back into the groove.",
      tone: "gray",
    };
  }

  return {
    eyebrow: "Today",
    title: "A short session is enough to restart.",
    description: "You do not need a big study block to keep this moving.",
    tone: "blue",
  };
}
