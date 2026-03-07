import { BaseEntity } from "./api";

// =============================================================
// Project Enums - khớp với com.mkwang.backend.modules.project.entity.*
// =============================================================

/** khớp với project.entity.ProjectStatus */
export enum ProjectStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  CLOSED = "CLOSED",
}

/** khớp với project.entity.PhaseStatus */
export enum PhaseStatus {
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
}

// =============================================================
// Project Interfaces - khớp với com.mkwang.backend.modules.project.entity.*
// =============================================================

/** khớp với project.entity.ProjectPhase */
export interface ProjectPhase extends BaseEntity {
  id: number;
  phaseCode: string;
  projectId: number;
  name: string;
  budgetLimit: number;
  currentSpent: number;
  status: PhaseStatus;
  startDate: string | null;
  endDate: string | null;
  remainingBudget: number; // computed
}

/** khớp với project.entity.ProjectMember */
export interface ProjectMember {
  projectId: number;
  userId: number;
  userName: string;
  role: string; // role within the project
}

/** khớp với project.entity.Project */
export interface Project extends BaseEntity {
  id: number;
  projectCode: string;
  name: string;
  departmentId: number;
  departmentName: string;
  managerId: number;
  managerName: string;
  totalBudget: number;
  totalSpent: number;
  status: ProjectStatus;
  currentPhaseId: number | null;
  phases: ProjectPhase[];
  members: ProjectMember[];
}
