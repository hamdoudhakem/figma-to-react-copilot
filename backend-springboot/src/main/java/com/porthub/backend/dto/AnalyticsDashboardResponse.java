package com.porthub.backend.dto;

import com.porthub.backend.models.DbAuditLog;
import lombok.Getter;

import java.util.List;

@Getter
public class AnalyticsDashboardResponse {
    // Getters and Setters
    private String ollamaStatus;
    private String modelName;
    private long totalGenerations;
    private long successCount;
    private long failedCount;
    private long cancelledCount;
    private double avgDurationSec;
    private String activeSessionId;
    private List<DbAuditLog> recentLogs;

    public AnalyticsDashboardResponse() {
    }

    public AnalyticsDashboardResponse(String ollamaStatus, String modelName, long totalGenerations,
            long successCount, long failedCount, long cancelledCount,
            double avgDurationSec, String activeSessionId, List<DbAuditLog> recentLogs) {
        this.ollamaStatus = ollamaStatus;
        this.modelName = modelName;
        this.totalGenerations = totalGenerations;
        this.successCount = successCount;
        this.failedCount = failedCount;
        this.cancelledCount = cancelledCount;
        this.avgDurationSec = avgDurationSec;
        this.activeSessionId = activeSessionId;
        this.recentLogs = recentLogs;
    }

}