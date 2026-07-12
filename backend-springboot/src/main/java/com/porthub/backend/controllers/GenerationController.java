package com.porthub.backend.controllers;

import com.porthub.backend.dto.GenerationRequest;
import com.porthub.backend.services.GenerationService;
import com.porthub.backend.services.McpClientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class GenerationController {

    @Autowired
    private GenerationService generationService;

    @Autowired
    private McpClientService mcpClientService;

    // Returns a pure, single string response once compilation finishes completely
    @PostMapping(value = "/generate", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> generateComponent(
            @RequestBody GenerationRequest request,
            @RequestHeader(value = "X-Session-ID", required = false) String xSessionId) {

        if (request.getFigmaUrl() == null || request.getFigmaUrl().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Figma workspace canvas URL is required.");
        }

        String sessionId = (xSessionId != null && !xSessionId.trim().isEmpty()) ? xSessionId : "recruiter-e7b413";

        try {
            // 1. Fetch data from Figma
            mcpClientService.fetchFigmaNodeData(request.getFigmaUrl());

            // 2. Execute the compilation blocking loop to accumulate the whole string
            // response
            String fullGeneratedCode = generationService.generateComponentBlocking(
                    request.getFigmaUrl(),
                    request.getPromptOverride(),
                    sessionId);

            return ResponseEntity.ok(fullGeneratedCode);

        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Generation Pipeline Failed: " + e.getMessage());
        }
    }
}