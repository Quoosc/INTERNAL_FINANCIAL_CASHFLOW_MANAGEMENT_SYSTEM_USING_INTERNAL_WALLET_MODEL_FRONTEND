export function toApiPage(uiPage: number): number {
  const safe = Number.isFinite(uiPage) ? uiPage : 1;
  return Math.max(0, Math.floor(safe) - 1);
}

export function toUiPage(apiPage: number): number {
  const safe = Number.isFinite(apiPage) ? apiPage : 0;
  return Math.max(1, Math.floor(safe) + 1);
}
