const appState = $state({
  lastTelemetryUpdate: 0,
});

export function useAppState() {
  return appState;
}
