import { RequestStatus, RequestSummaryResponse } from "@/types";

const LEGACY_ACCOUNTANT_QUEUE_STATUS = "PENDING_ACCOUNTANT_EXECUTION";

export type RequestStatusLike = RequestStatus | string | null | undefined;

export function normalizeRequestStatus(status: RequestStatusLike): RequestStatus {
	if (status === LEGACY_ACCOUNTANT_QUEUE_STATUS) {
		return RequestStatus.APPROVED_BY_TEAM_LEADER;
	}

	if (typeof status === "string") {
		const values = Object.values(RequestStatus) as string[];
		if (values.includes(status)) {
			return status as RequestStatus;
		}
	}

	return RequestStatus.PENDING;
}

export function isAccountantQueueStatus(status: RequestStatusLike): boolean {
	return normalizeRequestStatus(status) === RequestStatus.APPROVED_BY_TEAM_LEADER;
}

export function getPendingSummaryCount(summary: RequestSummaryResponse | null | undefined): number {
	return summary?.totalPendingApproval ?? 0;
}
