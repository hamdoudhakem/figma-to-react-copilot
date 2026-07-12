package com.porthub.backend.services;

import com.porthub.backend.dto.AnalyticsDashboardResponse;
import com.porthub.backend.models.DbAuditLog;
import com.porthub.backend.repositories.AuditLogRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.time.Duration;
import java.util.List;

@Service
public class AnalyticsService {

    private final AuditLogRepository auditLogRepository;
    private final WebClient baseOllamaClient;

    @Value("${app.llm.model:qwen2.5-coder:7b}")
    private String modelName;

    public AnalyticsService(AuditLogRepository auditLogRepository, WebClient.Builder webClientBuilder) {
        this.auditLogRepository = auditLogRepository;
        this.baseOllamaClient = webClientBuilder.baseUrl("http://127.0.0.1:11434").build();
    }

    public AnalyticsDashboardResponse calculateDashboardMetrics(String sessionId) {
        String ollamaStatus = "OFFLINE";

        // Ping the local Ollama health status tag checkpoint
        try {
            String response = this.baseOllamaClient.get()
                    .uri("/api/tags")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(1500))
                    .block();
            ollamaStatus = (response != null) ? "ONLINE" : "OFFLINE";
        } catch (Exception e) {
            ollamaStatus = "OFFLINE";
        }

        // Aggregating historical log collections
        List<DbAuditLog> allLogs = auditLogRepository.findAll();

        long totalGenerations = allLogs.size();
        long successCount = allLogs.stream().filter(l -> "SUCCESS".equalsIgnoreCase(l.getStatus())).count();
        long failedCount = allLogs.stream().filter(l -> "ERROR".equalsIgnoreCase(l.getStatus())).count();
        long cancelledCount = allLogs.stream().filter(l -> "CANCELLED".equalsIgnoreCase(l.getStatus())).count();

        // Compute average runtime footprint values while processing string format
        // variants safely
        double avgDurationSec = 0.0;
        List<DbAuditLog> successLogs = allLogs.stream()
                .filter(l -> "SUCCESS".equalsIgnoreCase(l.getStatus()) && l.getDuration() != null)
                .toList();

        if (!successLogs.isEmpty()) {
            double totalSec = 0.0;
            int validCount = 0;
            for (DbAuditLog log : successLogs) {
                try {
                    // Strips out trailing "s" characters appended during telemetry logging
                    String cleanDur = log.getDuration().replace("s", "").trim();
                    totalSec += Double.parseDouble(cleanDur);
                    validCount++;
                } catch (Exception ignored) {
                }
            }
            avgDurationSec = (validCount > 0) ? (totalSec / validCount) : 0.0;
        }

        // Return top 8 records for the layout logs viewport layout
        List<DbAuditLog> recentLogs = auditLogRepository.findActiveAuditLogs(sessionId).stream()
                .limit(8)
                .toList();

        return new AnalyticsDashboardResponse(
                ollamaStatus,
                modelName,
                totalGenerations,
                successCount,
                failedCount,
                cancelledCount,
                avgDurationSec,
                sessionId,
                recentLogs);
    }
}