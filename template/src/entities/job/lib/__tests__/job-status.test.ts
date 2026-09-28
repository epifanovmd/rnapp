import { EJobRunStatus } from "@shared/api/gen/main/model";

import { isJobActive, JOB_STATUS_LABEL } from "../job-status";

describe("isJobActive", () => {
  it("активны только ждущая и выполняющаяся задачи", () => {
    expect(isJobActive(EJobRunStatus.queued)).toBe(true);
    expect(isJobActive(EJobRunStatus.running)).toBe(true);
    expect(isJobActive(EJobRunStatus.completed)).toBe(false);
    expect(isJobActive(EJobRunStatus.failed)).toBe(false);
    expect(isJobActive(EJobRunStatus.cancelled)).toBe(false);
  });
});

describe("JOB_STATUS_LABEL", () => {
  it("есть подпись для каждого статуса", () => {
    Object.values(EJobRunStatus).forEach(status => {
      expect(JOB_STATUS_LABEL[status]).toBeTruthy();
    });
  });
});
