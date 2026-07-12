package com.porthub.backend.controllers;

import com.porthub.backend.dto.ComponentResponse;
import com.porthub.backend.models.DbComponent;
import com.porthub.backend.models.DbAuditLog;
import com.porthub.backend.repositories.ComponentRepository;
import com.porthub.backend.repositories.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class DataController {

    @Autowired
    private ComponentRepository componentRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @GetMapping("/components")
    public ResponseEntity<List<ComponentResponse>> getComponents(
            @RequestHeader(value = "X-Session-ID", required = false) String xSessionId) {

        String sessionId = (xSessionId != null && !xSessionId.trim().isEmpty()) ? xSessionId : "PORTFOLIO_SEED";

        // Fetch entities from database
        List<DbComponent> components = componentRepository.findActiveComponents(sessionId);

        // Map entities to our snake_case protected DTO layer
        List<ComponentResponse> response = components.stream()
                .map(ComponentResponse::new)
                .toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/logs")
    public ResponseEntity<List<DbAuditLog>> getAuditLogs(
            @RequestHeader(value = "X-Session-ID", required = false) String xSessionId) {

        String sessionId = (xSessionId != null && !xSessionId.trim().isEmpty()) ? xSessionId : "PORTFOLIO_SEED";
        List<DbAuditLog> logs = auditLogRepository.findActiveAuditLogs(sessionId);
        return ResponseEntity.ok(logs);
    }
}