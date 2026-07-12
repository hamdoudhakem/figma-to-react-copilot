package com.porthub.backend.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.porthub.backend.models.DbAuditLog;
import com.porthub.backend.models.DbComponent;
import com.porthub.backend.repositories.AuditLogRepository;
import com.porthub.backend.repositories.ComponentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

@Service
public class GenerationService {

    private final McpClientService mcpClientService;
    private final ComponentRepository componentRepository;
    private final AuditLogRepository auditLogRepository;
    private final WebClient openaiClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.llm.model:qwen2.5-coder:7b}")
    private String targetModel;

    public GenerationService(McpClientService mcpClientService,
            ComponentRepository componentRepository,
            AuditLogRepository auditLogRepository,
            WebClient.Builder webClientBuilder,
            @Value("${app.llm.base-url:http://localhost:11434/v1}") String openAiBaseUrl,
            @Value("${app.llm.api-key:ollama-local-token}") String apiKey) {
        this.mcpClientService = mcpClientService;
        this.componentRepository = componentRepository;
        this.auditLogRepository = auditLogRepository;
        this.openaiClient = webClientBuilder
                .baseUrl(openAiBaseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    public String generateComponentBlocking(String figmaUrl, String promptOverride, String sessionId) {
        long startTime = System.nanoTime();
        Map<String, String> parsed = mcpClientService.parseFigmaUrl(figmaUrl);
        String fileKey = parsed.getOrDefault("fileKey", "Unknown");

        String figmaJsonStr;
        try {
            String rawFigmaJson = mcpClientService.fetchFigmaNodeData(figmaUrl);
            figmaJsonStr = pruneFigmaNoise(rawFigmaJson);
        } catch (Exception e) {
            recordTelemetry(startTime, fileKey, "MCP_EXTRACTION_FAILED", "ERROR", "", figmaUrl, sessionId,
                    promptOverride);
            throw new RuntimeException("MCP Error: " + e.getMessage());
        }

        String systemPrompt = """
                    "You are an elite Frontend Engineer expert in React and Tailwind CSS.\n"
                    "Your objective is to convert a structural Figma JSON tree into high-fidelity React code.\n\n"
                    "CRUCIAL STRUCTURAL CONSTRAINTS (NEVER VIOLATE):\n"
                    "1. Return ONLY valid, executable React component code layers.\n"
                    "2. Do NOT provide markdown explanations, introductory sentences, chatty feedback, or summary paragraphs OUTSIDE of the code block. Your output must be purely code.\n"
                    "3. Output must start immediately with imports and export a default component named 'App'.\n"
                    "4. Apply responsive layouts using Tailwind utility classes exclusively.\n"
                    "5. FLEXIBILITY RULE: If the user asks for explanations, documentation, or code comments, you MUST implement them, but they must live strictly INSIDE the React component using standard programming comment syntax (e.g., standard JavaScript inline '//' comments or React '{/* */}' block comments)."
                """;

        StringBuilder userContentBuilder = new StringBuilder("Figma Structural Tree:\n").append(figmaJsonStr)
                .append("\n");
        if (promptOverride != null && !promptOverride.isBlank()) {
            userContentBuilder.append("\n[STRICT MODIFICATION DIRECTIVE]\n").append(promptOverride).append("\n");
        }

        Map<String, Object> requestBody = Map.of(
                "model", targetModel,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userContentBuilder.toString())),
                "stream", true, // Keep true so we can filter markdown elements sequentially out of the local
                                // stream
                "temperature", 0.0);

        // Collect all incoming chunks into a single definitive string block
        try {
            String fullCode = this.openaiClient.post()
                    .uri("/chat/completions")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToFlux(String.class)
                    .filter(line -> !line.trim().equals("data: [DONE]"))
                    .map(line -> {
                        try {
                            String cleanJson = line.startsWith("data:") ? line.substring(5).trim() : line.trim();
                            JsonNode node = objectMapper.readTree(cleanJson);
                            JsonNode contentNode = node.path("choices").get(0).path("delta").path("content");
                            if (!contentNode.isMissingNode() && contentNode.textValue() != null) {
                                String token = contentNode.textValue();
                                if (token.contains("```"))
                                    return "";
                                if (token.trim().equalsIgnoreCase("jsx") || token.trim().equalsIgnoreCase("tsx")
                                        || token.trim().equalsIgnoreCase("javascript"))
                                    return "";
                                return token;
                            }
                        } catch (Exception ignored) {
                        }
                        return "";
                    })
                    .filter(token -> !token.isEmpty())
                    .reduce("", String::concat) // Combine every token into a single text block
                    .block(); // Blocks until the local 7B model finishes generation entirely

            // Save layout configurations to history telemetry databases
            recordTelemetry(startTime, fileKey, "GEN_REACT_COMPONENT", "SUCCESS", fullCode, figmaUrl, sessionId,
                    promptOverride);
            return fullCode;
        } catch (Exception e) {
            recordTelemetry(startTime, fileKey, "GEN_REACT_COMPONENT", "ERROR", "", figmaUrl, sessionId,
                    promptOverride);
            throw new RuntimeException("LLM processing execution failure: " + e.getMessage());
        }
    }

    public Flux<String> streamComponentGeneration(String figmaUrl, String promptOverride, String sessionId) {
        long startTime = System.nanoTime();
        Map<String, String> parsed = mcpClientService.parseFigmaUrl(figmaUrl);
        String fileKey = parsed.getOrDefault("fileKey", "Unknown");

        String figmaJsonStr;
        try {
            // 1. Fetch raw payload and aggressively prune noise to preserve LLM token
            // attention context
            String rawFigmaJson = mcpClientService.fetchFigmaNodeData(figmaUrl);
            figmaJsonStr = pruneFigmaNoise(rawFigmaJson);
        } catch (Exception e) {
            recordTelemetry(startTime, fileKey, "MCP_EXTRACTION_FAILED", "ERROR", "", figmaUrl, sessionId,
                    promptOverride);
            return Flux.just("⚠️ [MCP Error]: " + e.getMessage());
        }

        // 2. Clear explicit layout mapping instructions for a smaller 7B model
        String systemPrompt = """
                You are an elite Frontend Engineer. Convert the provided structural Figma JSON layout directly into a single file high-fidelity React component using Tailwind CSS utility classes.

                CRITICAL OUTPUT SCHEMATICS:
                - Provide ONLY functional executable React code.
                - Do NOT include any markdown code block wrappers (```, ```jsx), intro text, or conversational explanations.
                - Start immediately with imports (e.g. import React from 'react';) and export a single default component named 'App'.
                - Replicate the element positioning, font weights, colors, shapes, and children hierarchies outlined in the JSON payload exactly.
                """;

        StringBuilder userContentBuilder = new StringBuilder("Figma Structural Tree:\n")
                .append(figmaJsonStr).append("\n");

        if (promptOverride != null && !promptOverride.isBlank()) {
            userContentBuilder.append("\n[STRICT MODIFICATION DIRECTIVE]\n")
                    .append(promptOverride).append("\n");
        }

        Map<String, Object> requestBody = Map.of(
                "model", targetModel,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userContentBuilder.toString())),
                "stream", true,
                "temperature", 0.0 // Reduced variance to force literal layout compliance
        );

        StringBuilder codeAccumulator = new StringBuilder();
        String[] executionStatus = { "SUCCESS" };

        return this.openaiClient.post()
                .uri("/chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToFlux(String.class)
                .filter(line -> !line.trim().equals("data: [DONE]"))
                .map(line -> {
                    try {
                        String cleanJson = line.startsWith("data:") ? line.substring(5).trim() : line.trim();
                        JsonNode node = objectMapper.readTree(cleanJson);
                        JsonNode contentNode = node.path("choices").get(0).path("delta").path("content");

                        if (!contentNode.isMissingNode() && contentNode.textValue() != null) {
                            String token = contentNode.textValue();

                            // Programmatic sanitization: Strip code fences so the frontend gets raw
                            // executable code
                            if (token.contains("```")) {
                                return "";
                            }
                            if (codeAccumulator.isEmpty() && (token.trim().equalsIgnoreCase("jsx")
                                    || token.trim().equalsIgnoreCase("javascript"))) {
                                return "";
                            }

                            codeAccumulator.append(token);
                            return token;
                        }
                    } catch (Exception ignored) {
                    }
                    return "";
                })
                .filter(token -> !token.isEmpty())
                .doOnError(err -> executionStatus[0] = "ERROR")
                .doOnCancel(() -> {
                    executionStatus[0] = "CANCELLED";
                    recordTelemetry(startTime, fileKey, "GEN_REACT_COMPONENT", "CANCELLED", codeAccumulator.toString(),
                            figmaUrl, sessionId, promptOverride);
                })
                .doFinally(signalType -> {
                    if (!"CANCELLED".equals(executionStatus[0])) {
                        Schedulers.boundedElastic().schedule(() -> recordTelemetry(
                                startTime, fileKey, "GENERATE_REACT_COMPONENT", executionStatus[0],
                                codeAccumulator.toString(), figmaUrl, sessionId, promptOverride));
                    }
                });
    }

    /**
     * Minimizes Figma JSON tree structural data down to context essentials.
     * Prevents context exhaustion and forces the 7B LLM to read real structural
     * metrics.
     */
    private String pruneFigmaNoise(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            cleanJsonNode(root);
            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            return rawJson; // Safe fallback on exception
        }
    }

    private void cleanJsonNode(JsonNode node) {
        if (node.isObject()) {
            ObjectNode objectNode = (ObjectNode) node;
            // List of excessively verbose properties that distract a 7B LLM from raw layout
            // generation
            List<String> noiseFields = List.of(
                    "blendMode", "constraints", "exportSettings", "effects", "strokes",
                    "strokeWeight", "strokeAlign", "styles", "pluginData", "sharedPluginData",
                    "transitionNodeID", "transitionDuration", "transitionEasing", "locked", "expanded");

            objectNode.remove(noiseFields);

            // Recurse deeply into component layer hierarchies
            Iterator<JsonNode> elements = objectNode.elements();
            while (elements.hasNext()) {
                cleanJsonNode(elements.next());
            }
        } else if (node.isArray()) {
            for (JsonNode element : node) {
                cleanJsonNode(element);
            }
        }
    }

    private void recordTelemetry(long startNanoTime, String target, String action, String status,
            String codeSnapshot, String figmaUrl, String sessionId, String userPrompt) {
        try {
            double durationSec = (System.nanoTime() - startNanoTime) / 1_000_000_000.0;
            String durationStr = String.format("%.2fs", durationSec);
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("Y-MM-dd HH:mm:ss"));

            DbAuditLog log = new DbAuditLog();
            log.setAction(action);
            log.setTargetComponent(target);
            log.setDuration(durationStr);
            log.setStatus(status);
            log.setSessionId(sessionId);
            log.setTimestamp(timestamp);
            auditLogRepository.save(log);

            if (figmaUrl != null) {
                DbComponent comp = new DbComponent();
                comp.setName("Sync-" + (target.length() > 8 ? target.substring(0, 8) : target));
                comp.setFigmaUrl(figmaUrl);
                comp.setGeneratedCode(codeSnapshot);
                comp.setUserPrompt(userPrompt);
                comp.setStatus("SUCCESS".equals(status) ? "SYNCED" : status);
                comp.setLastUpdated(timestamp);
                comp.setSessionId(sessionId);
                componentRepository.save(comp);
            }
            System.out.println(
                    "🍏 [Telemetry Sync]: Successfully flushed transactional updates for session " + sessionId);
        } catch (Exception e) {
            System.err.println("🔴 [Telemetry DB Error]: " + e.getMessage());
        }
    }
}