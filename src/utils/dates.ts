export function formatYearRange(dates: string[]): string {
  const years = Array.from(
    new Set(dates.map((date) => new Date(date).getFullYear()))
  ).sort();

  if (years.length === 1) {
    return years[0].toString();
  }

  return `${years[0]}-${years[years.length - 1]}`;
}

export function formatRuntime(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs > 0 ? hrs + " h " : ""}${mins > 0 ? mins + " min" : ""}`;
}
