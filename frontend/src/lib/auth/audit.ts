import { prisma } from "../prisma";

export type AuditAction = 
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "ACCOUNT_LOCKED"
  | "MFA_TRIGGERED"
  | "MFA_VERIFIED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_CHANGED"
  | "DATA_ACCESS"
  | "ROLE_UPDATED"
  | "SESSION_REVOKED"
  | "SOCIAL_LINK_SUCCESS";

interface AuditEvent {
  action: AuditAction;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Enterprise-grade security event logger.
 * Writes critical actions sequentially to the database for DPDP/GDPR traceability.
 */
export async function logAuditEvent({ action, userId, ipAddress, userAgent, metadata }: AuditEvent) {
  try {
    // Structure metadata for better querying
    const enrichedMetadata = {
      ...metadata,
      userAgent: userAgent || "unknown",
      platform: "Aether Web Platform",
    };

    await prisma.auditLog.create({
      data: {
        action,
        userId: userId || null,
        ipAddress: ipAddress || "unknown",
        contextualMetadata: JSON.stringify(enrichedMetadata),
      },
    });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR] Failed to record event:", action, error);
  }
}
