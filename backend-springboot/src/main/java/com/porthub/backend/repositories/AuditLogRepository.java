package com.porthub.backend.repositories;

import com.porthub.backend.models.DbAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<DbAuditLog, Long> {

    @Query("SELECT l FROM DbAuditLog l WHERE l.sessionId = :sessionId OR l.sessionId = 'PORTFOLIO_SEED' ORDER BY l.id DESC")
    List<DbAuditLog> findActiveAuditLogs(@Param("sessionId") String sessionId);
}