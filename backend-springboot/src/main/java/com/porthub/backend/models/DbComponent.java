package com.porthub.backend.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Entity
@Table(name = "components")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DbComponent {

    @Id
    @Column(length = 50)
    private String id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "figma_url", nullable = false, columnDefinition = "TEXT")
    private String figmaUrl;

    @Column(name = "generated_code", columnDefinition = "TEXT")
    private String generatedCode;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "last_updated", nullable = false, length = 50)
    private String lastUpdated;

    @Column(name = "session_id", nullable = false, length = 255)
    private String sessionId;

    @Column(name = "user_prompt", columnDefinition = "TEXT")
    private String userPrompt;

    // Replicates Python default value/ID generation logic before saving to database
    @PrePersist
    protected void onCreate() {
        if (this.id == null || this.id.isBlank()) {
            String shortUuid = UUID.randomUUID().toString().replace("-", "").substring(0, 6);
            this.id = "comp-" + shortUuid;
        }
        if (this.status == null) {
            this.status = "SYNCED";
        }
        if (this.sessionId == null) {
            this.sessionId = "PORTFOLIO_SEED";
        }
        if (this.lastUpdated == null) {
            this.lastUpdated = ZonedDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        }
    }
}