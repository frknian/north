// Native companions can implement this contract after explicit device permission.
// The browser adapter never claims to control system notifications or other apps.
export interface FocusCompanion {
  capabilities: { doNotDisturb: boolean; appBlocking: boolean };
  start: (areaId: string) => Promise<void>;
  stop: () => Promise<void>;
}
export const browserCompanion: FocusCompanion = {
  capabilities: { doNotDisturb: false, appBlocking: false },
  start: async () => {}, stop: async () => {},
};
