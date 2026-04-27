import {
  RequestAction,
  RequestAttachmentResponse,
  RequestTimelineEntry,
  RequestType,
  TLApprovalDetailResponse,
  TLApprovalListItem,
} from "@/types";
import { normalizeRequestStatus } from "@/lib/adapters/request-status";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord {
  if (value && typeof value === "object") {
    return value as AnyRecord;
  }
  return {};
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asRequestType(value: unknown): RequestType {
  const valid = Object.values(RequestType) as string[];
  return typeof value === "string" && valid.includes(value)
    ? (value as RequestType)
    : RequestType.ADVANCE;
}

function mapAttachments(value: unknown): RequestAttachmentResponse[] {
  if (!Array.isArray(value)) return [];

  return value.map((item, index) => {
    const raw = asRecord(item);
    return {
      fileId: asNumber(raw.fileId, index + 1),
      fileName: asString(raw.fileName, "attachment"),
      cloudinaryPublicId: asNullableString(raw.cloudinaryPublicId) ?? undefined,
      url: asString(raw.url, "#"),
      fileType: asString(raw.fileType, "application/octet-stream"),
      size: asNumber(raw.size, 0),
    };
  });
}

function asRequestAction(value: unknown): RequestAction {
  const valid = Object.values(RequestAction) as string[];
  return typeof value === "string" && valid.includes(value)
    ? (value as RequestAction)
    : RequestAction.APPROVE;
}

function mapTimeline(value: unknown): RequestTimelineEntry[] {
  if (!Array.isArray(value)) return [];

  return value.map((item, index) => {
    const raw = asRecord(item);
    return {
      id: asNumber(raw.id, index + 1),
      action: asRequestAction(raw.action),
      statusAfterAction: normalizeRequestStatus(raw.statusAfterAction),
      actorId: asNumber(raw.actorId, 0),
      actorName: asString(raw.actorName, "System"),
      comment: asNullableString(raw.comment),
      createdAt: asString(raw.createdAt, new Date().toISOString()),
    };
  });
}

export function normalizeTLApprovalListItem(
  input: unknown,
): TLApprovalListItem {
  const raw = asRecord(input);
  const requester = asRecord(raw.requester);
  const project = asRecord(raw.project);
  const phase = asRecord(raw.phase);
  const category = asRecord(raw.category);

  const categoryId =
    asNumber(raw.categoryId, Number.NaN) || asNumber(category.id, Number.NaN);

  return {
    id: asNumber(raw.id, 0),
    requestCode: asString(raw.requestCode, "N/A"),
    type: asRequestType(raw.type),
    status: normalizeRequestStatus(raw.status),
    amount: asNumber(raw.amount, 0),
    description: asNullableString(raw.description),
    requester: {
      id: asNumber(requester.id, 0),
      fullName: asString(requester.fullName, "Unknown"),
      avatar: asNullableString(requester.avatar),
      employeeCode: asString(requester.employeeCode, "N/A"),
      jobTitle: asNullableString(requester.jobTitle),
      email: asString(requester.email, ""),
    },
    project: {
      id: asNumber(project.id, 0),
      projectCode: asString(project.projectCode, "N/A"),
      name:
        asNullableString(project.name) ?? asString(project.projectCode, "N/A"),
    },
    phase: {
      id: asNumber(phase.id, 0),
      phaseCode: asString(phase.phaseCode, "N/A"),
      name: asNullableString(phase.name) ?? asString(phase.phaseCode, "N/A"),
      budgetLimit:
        typeof phase.budgetLimit === "number"
          ? asNumber(phase.budgetLimit, 0)
          : undefined,
      currentSpent:
        typeof phase.currentSpent === "number"
          ? asNumber(phase.currentSpent, 0)
          : undefined,
    },
    category:
      Number.isFinite(categoryId) || typeof category.name === "string"
        ? {
            id: Number.isFinite(categoryId) ? categoryId : 0,
            name:
              asNullableString(raw.categoryName) ??
              asNullableString(category.name),
          }
        : null,
    categoryId: Number.isFinite(categoryId) ? categoryId : null,
    categoryName:
      asNullableString(raw.categoryName) ?? asNullableString(category.name),
    attachments: mapAttachments(raw.attachments),
    createdAt: asString(raw.createdAt, new Date().toISOString()),
  };
}

export function normalizeTLApprovalList(input: unknown): TLApprovalListItem[] {
  if (!Array.isArray(input)) return [];
  return input.map((item) => normalizeTLApprovalListItem(item));
}

export function normalizeTLApprovalDetail(
  input: unknown,
): TLApprovalDetailResponse {
  const raw = asRecord(input);
  const requester = asRecord(raw.requester);
  const project = asRecord(raw.project);
  const phase = asRecord(raw.phase);

  return {
    id: asNumber(raw.id, 0),
    requestCode: asString(raw.requestCode, "N/A"),
    type: asRequestType(raw.type),
    status: normalizeRequestStatus(raw.status),
    amount: asNumber(raw.amount, 0),
    approvedAmount:
      raw.approvedAmount === null || raw.approvedAmount === undefined
        ? null
        : asNumber(raw.approvedAmount, 0),
    description: asNullableString(raw.description),
    rejectReason: asNullableString(raw.rejectReason),
    requester: {
      id: asNumber(requester.id, 0),
      fullName: asString(requester.fullName, "Unknown"),
      avatar: asNullableString(requester.avatar),
      employeeCode: asString(requester.employeeCode, "N/A"),
      jobTitle: asNullableString(requester.jobTitle),
      email: asString(requester.email, ""),
    },
    project: {
      id: asNumber(project.id, 0),
      projectCode: asString(project.projectCode, "N/A"),
      name:
        asNullableString(project.name) ?? asString(project.projectCode, "N/A"),
    },
    phase: {
      id: asNumber(phase.id, 0),
      phaseCode: asString(phase.phaseCode, "N/A"),
      name: asNullableString(phase.name) ?? asString(phase.phaseCode, "N/A"),
      budgetLimit:
        typeof phase.budgetLimit === "number"
          ? asNumber(phase.budgetLimit, 0)
          : undefined,
      currentSpent:
        typeof phase.currentSpent === "number"
          ? asNumber(phase.currentSpent, 0)
          : undefined,
    },
    categoryId:
      raw.categoryId === null || raw.categoryId === undefined
        ? null
        : asNumber(raw.categoryId, 0),
    categoryName: asNullableString(raw.categoryName),
    attachments: mapAttachments(raw.attachments),
    timeline: mapTimeline(raw.timeline),
    createdAt: asString(raw.createdAt, new Date().toISOString()),
    updatedAt: asString(
      raw.updatedAt,
      asString(raw.createdAt, new Date().toISOString()),
    ),
  };
}
