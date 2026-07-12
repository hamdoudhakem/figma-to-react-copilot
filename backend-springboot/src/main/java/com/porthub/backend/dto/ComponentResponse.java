package com.porthub.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.porthub.backend.models.DbComponent;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class ComponentResponse {
    // Getters and Setters
    private String id;
    private String name;

    @JsonProperty("figma_url")
    private String figmaUrl;

    @JsonProperty("generated_code")
    private String generatedCode;

    private String status;

    @JsonProperty("session_id")
    private String sessionId;

    @JsonProperty("last_updated")
    private String lastUpdated;

    @JsonProperty("user_prompt")
    private String userPrompt;

    public ComponentResponse(DbComponent comp) {
        this.id = comp.getId();
        this.name = comp.getName();
        this.figmaUrl = comp.getFigmaUrl();
        this.generatedCode = comp.getGeneratedCode();
        this.status = comp.getStatus();
        this.sessionId = comp.getSessionId();
        this.lastUpdated = comp.getLastUpdated();
        this.userPrompt = comp.getUserPrompt();
    }

}