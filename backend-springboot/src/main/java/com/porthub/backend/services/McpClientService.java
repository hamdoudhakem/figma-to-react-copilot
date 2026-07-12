package com.porthub.backend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class McpClientService {

    private final WebClient webClient;
    private final String figmaAccessToken;

    // Global directory mapping for local node inspection snapshots matching Python
    // cache
    private static final Path CACHE_DIR = Paths.get(".figma_cache");

    public McpClientService(WebClient.Builder webClientBuilder,
            @Value("${app.figma.access-token:}") String figmaAccessToken) {
        this.figmaAccessToken = figmaAccessToken;
        this.webClient = webClientBuilder
                .baseUrl("https://api.figma.com/v1")
                .defaultHeader("X-Figma-Token", figmaAccessToken)
                .build();
    }

    /**
     * Extracts file key and structural node ID from a live Figma URL canvas link
     */
    public Map<String, String> parseFigmaUrl(String url) {
        Map<String, String> result = new HashMap<>();
        if (url == null || url.isBlank())
            return result;

        try {
            URI uri = new URI(url);
            String path = uri.getPath();

            // Clean paths and find file key context matching Python array index extraction
            String[] pathParts = path.replaceAll("^/|/$", "").split("/");
            String fileKey = null;

            for (int i = 0; i < pathParts.length; i++) {
                if (("design".equals(pathParts[i]) || "file".equals(pathParts[i])) && (i + 1 < pathParts.length)) {
                    fileKey = pathParts[i + 1];
                    break;
                }
            }
            if (fileKey == null && pathParts.length >= 2) {
                fileKey = pathParts[1];
            }

            // Isolate standard node-id queries and switch "-" separators to native Figma
            // ":" schemas
            String query = uri.getQuery();
            String nodeId = null;
            if (query != null) {
                Pattern pattern = Pattern.compile("node-id=([^&]+)");
                Matcher matcher = pattern.matcher(query);
                if (matcher.find()) {
                    nodeId = java.net.URLDecoder.decode(matcher.group(1), StandardCharsets.UTF_8).replace("-", ":");
                }
            }

            if (fileKey != null)
                result.put("fileKey", fileKey);
            if (nodeId != null)
                result.put("nodeId", nodeId);

        } catch (Exception e) {
            System.err.println("⚠️ Malformed URL format: " + e.getMessage());
        }
        return result;
    }

    /**
     * Replicates the complete Layer A cache lookup, data fetch, and Layer B write
     * cycles
     */
    public String fetchFigmaNodeData(String figmaUrl) {
        Map<String, String> parsed = parseFigmaUrl(figmaUrl);
        String fileKey = parsed.get("fileKey");
        String nodeId = parsed.get("nodeId");

        if (fileKey == null) {
            throw new IllegalArgumentException("Invalid Figma URL schema. Unable to extract File Key.");
        }

        String safeNodeId = (nodeId != null) ? nodeId.replace(":", "-") : "full_canvas";
        String cacheFilename = fileKey + "_" + safeNodeId + ".json";
        Path cacheFilePath = CACHE_DIR.resolve(cacheFilename);

        // LAYER A : CACHE LOOKUP & BYPASS INTERCEPTOR
        // TO DISABLE READING FROM THE CACHE, SIMPLY COMMENT OUT THE NEXT 2 LINES:
        String cachedData = this.readFromLocalCache(cacheFilePath);
        if (cachedData != null)
            return cachedData;

        if (figmaAccessToken == null || figmaAccessToken.isBlank()) {
            throw new IllegalStateException(
                    "FIGMA_ACCESS_TOKEN is completely missing from your environmental configurations.");
        }

        System.out.println("🚀 [Figma Remote Fetch]: Resolving structural design trees for fileKey: " + fileKey
                + ", nodeId: " + nodeId);

        // Native WebClient implementation resolving the tree with zero subprocess lag
        String responseText;
        try {
            if (nodeId != null) {
                responseText = this.webClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/files/{fileKey}/nodes")
                                .queryParam("ids", nodeId)
                                .build(fileKey))
                        .retrieve()
                        .bodyToMono(String.class)
                        .block(); // Safe blocking bounds under virtual thread setups
            } else {
                responseText = this.webClient.get()
                        .uri("/files/{fileKey}", fileKey)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();
            }
        } catch (Exception e) {
            throw new RuntimeException("Figma API Server Connection Failure: " + e.getMessage(), e);
        }

        if (responseText == null || responseText.isBlank()) {
            throw new IllegalStateException("The Figma endpoint returned an empty content body response.");
        }

        // LAYER B : WRITE SNAPSHOT TO CACHE FOR EASIER RUNTIME INSPECTION
        // TO DISABLE WRITING SNAPSHOTS TO THE CACHE, SIMPLY COMMENT OUT THIS LINE:
        this.saveToLocalCache(cacheFilePath, responseText);

        return responseText;
    }

    /**
     * Helper method to handle file reading operations for Layer A
     */
    private String readFromLocalCache(Path cacheFilePath) {
        if (Files.exists(cacheFilePath)) {
            try {
                System.out.println(
                        "📂 [Figma Cache Hit]: Bypassing live fetch. Loading cached design tree directly from: "
                                + cacheFilePath);
                return Files.readString(cacheFilePath, StandardCharsets.UTF_8);
            } catch (IOException e) {
                System.err.println("⚠️ [Cache Read Error]: Fallback triggered to active retrieval: " + e.getMessage());
            }
        }
        return null;
    }

    /**
     * Helper method to handle file writing operations for Layer B
     */
    private void saveToLocalCache(Path cacheFilePath, String content) {
        try {
            if (!Files.exists(CACHE_DIR)) {
                Files.createDirectories(CACHE_DIR);
            }
            Files.writeString(cacheFilePath, content, StandardCharsets.UTF_8);
            System.out.println(
                    "💾 [Figma Cache Saved]: Raw layout tree stored successfully. File footprint: " + cacheFilePath);
        } catch (Exception cacheErr) {
            System.err.println(
                    "⚠️ [Figma Cache Error]: Failed to save snapshot file footprint: " + cacheErr.getMessage());
        }
    }
}