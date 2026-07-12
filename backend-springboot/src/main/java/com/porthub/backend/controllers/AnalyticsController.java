package com.porthub.backend.controllers;

import com.porthub.backend.dto.AnalyticsDashboardResponse;
import com.porthub.backend.services.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/analytics") // Combined with context path, becomes /api/analytics
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    // Resolves exactly to: GET /api/analytics/stats
    @GetMapping("/stats")
    public ResponseEntity<AnalyticsDashboardResponse> getPlatformStats(
            @RequestHeader(value = "X-Session-ID", required = false) String xSessionId) {

        String sessionId = (xSessionId != null && !xSessionId.trim().isEmpty()) ? xSessionId : "PORTFOLIO_SEED";

        AnalyticsDashboardResponse metrics = analyticsService.calculateDashboardMetrics(sessionId);
        return ResponseEntity.ok(metrics);
    }
}