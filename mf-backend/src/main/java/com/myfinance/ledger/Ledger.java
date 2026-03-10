package com.myfinance.ledger;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.myfinance.transaction.Transaction;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ledgers")
public class Ledger extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public String id;

    @Column(nullable = false)
    public String title;

    @Column(name = "owner_id", nullable = false)
    public String ownerId;

    @Column(name = "participant_id", nullable = true)
    public String participantId;

    @Column(name = "target_name", nullable = false)
    public String targetName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public LedgerStatus status = LedgerStatus.ACCEPTED;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    public LocalDateTime createdAt;

    @OneToMany(mappedBy = "ledger", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("ledger") // Evitar loop infinito no JSON
    public List<Transaction> transactions = new ArrayList<>();

    public static List<Ledger> findByOwnerOrParticipant(String userId) {
        return find("ownerId = ?1 or participantId = ?1 order by createdAt desc", userId).list();
    }
}
