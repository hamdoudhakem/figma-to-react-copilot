package com.porthub.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GenerationRequest {
    // Getters and Setters
    @JsonProperty("figma_url")
    private String figmaUrl;

    @JsonProperty("prompt_override")
    private String promptOverride;

}