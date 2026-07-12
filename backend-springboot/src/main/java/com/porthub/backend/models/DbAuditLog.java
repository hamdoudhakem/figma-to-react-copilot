package com.porthub.backend.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DbAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 50)
    private String timestamp;

    @Column(nullable = false, length = 255)
    private String action;

    @Column(name = "target_component", nullable = false, length = 255)
    private String targetComponent;

    @Column(nullable = false, length = 50)
    private String duration;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "session_id", nullable = false, length = 255)
    private String sessionId;

    @PrePersist
    protected void onCreate() {
        if (this.sessionId == null) {
            this.sessionId = "PORTFOLIO_SEED";
        }
        if (this.timestamp == null) {
            this.timestamp = ZonedDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        }
    }
}