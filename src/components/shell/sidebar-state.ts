export const SIDEBAR_COOKIE = "echo-sidebar";

/**
 * Reads the remembered sidebar choice from its cookie value.
 *
 * @param value - The raw cookie value, if any.
 * @returns True when the user collapsed the sidebar.
 */
export function isSidebarCollapsed(value: string | undefined): boolean {
  return value === "collapsed";
}
