package com.backofficepro.surveyplatform.identity.domain;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "organizations", schema = "identity")
public class Organization extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "owner_id", nullable = false, length = 100)
    private String ownerId;

    @Column(name = "org_created_at", nullable = false)
    private LocalDateTime createdAt;

    protected Organization() {
        super();
    }

    public static Organization create(final String name, final String ownerId) {
        final Organization org = new Organization();
        org.name = name;
        org.ownerId = ownerId;
        org.createdAt = LocalDateTime.now();
        return org;
    }
}
