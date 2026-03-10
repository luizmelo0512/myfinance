package com.myfinance.transaction;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.myfinance.ledger.Ledger;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public String id;

    @Column(precision = 10, scale = 2, nullable = false)
    public BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public TransactionType type;

    @Column(nullable = true)
    public String description;

    @Column(name = "transaction_date", nullable = true)
    public LocalDateTime transactionDate;

    @Column(name = "created_by_id", nullable = true)
    public String createdById;

    @Column(name = "created_by_name", nullable = true)
    public String createdByName;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    public LocalDateTime createdAt;

    @ManyToOne(optional = false)
    @JoinColumn(name = "ledger_id", nullable = false)
    @JsonIgnoreProperties("transactions") // Para não serializar o ledger inteiro dentro da transação e causar loop
    public Ledger ledger;
}
