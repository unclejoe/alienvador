import { request } from "../request";

export interface UpdateStatus {
  current_version: string;
  latest_version: string | null;
  has_update: boolean;
  is_editable: boolean;
  /** Non-null when the process was launched via `octop service start` (systemd or launchd). */
  service_mode: "systemd" | "launchd" | null;
  /** True when Octop is spawned by the Wails desktop shell (or ``OCTOP_DESKTOP=1``). */
  desktop?: boolean;
  error: string | null;
  /** Stable error code (e.g. "pypi_unreachable") for localized UI messages; null on success. */
  error_code: string | null;
  /** Mirror that served the version info (null/`pypi.org` = official source). */
  source: string | null;
  last_check_time: string | null;
  /** Markdown changelog for latest_version, null if not available. */
  release_notes: string | null;
  /** When true (default), automatic checks ignore pre-releases. */
  stable_only?: boolean;
  /** True when latest_version is a PEP 440 pre-release. */
  latest_is_prerelease?: boolean;
}

export interface RestartResponse {
  status: "restarting";
  service_mode: string;
}

export const updateApi = {
  getUpdateStatus: () => request<UpdateStatus>("/update/status"),
  restartService: () =>
    request<RestartResponse>("/update/restart", { method: "POST" }),
};
