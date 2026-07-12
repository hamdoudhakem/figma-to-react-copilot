package com.porthub.backend.repositories;

import com.porthub.backend.models.DbComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ComponentRepository extends JpaRepository<DbComponent, String> {

    // Replicates the complex SQLAlchemy or_(session_id == active, session_id == 'PORTFOLIO_SEED') logic
    @Query("SELECT c FROM DbComponent c WHERE c.sessionId = :sessionId OR c.sessionId = 'PORTFOLIO_SEED' ORDER BY c.lastUpdated DESC")
    List<DbComponent> findActiveComponents(@Param("sessionId") String sessionId);
}