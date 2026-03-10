package com.myfinance.ledger;

import com.myfinance.ledger.dto.CreateLedgerDTO;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class LedgerService {

    @Transactional
    public Ledger create(CreateLedgerDTO dto, String userId) {
        Ledger ledger = new Ledger();
        ledger.title = dto.title;
        ledger.targetName = dto.targetName;
        ledger.ownerId = userId;
        ledger.participantId = dto.participantId;

        // Se tem participante, precisa de aceite
        if (dto.participantId != null && !dto.participantId.isEmpty()) {
            ledger.status = LedgerStatus.PENDING;
        } else {
            ledger.status = LedgerStatus.ACCEPTED;
        }

        ledger.persist();
        return ledger;
    }

    public List<Ledger> findAll(String userId) {
        return Ledger.findByOwnerOrParticipant(userId);
    }

    public Ledger findOne(String id, String userId) {
        Ledger ledger = Ledger.findById(id);
        if (ledger == null)
            return null;

        if (!ledger.ownerId.equals(userId) && !userId.equals(ledger.participantId)) {
            throw new SecurityException("Sem permissão");
        }
        return ledger;
    }

    @Transactional
    public Ledger accept(String id, String userId) {
        Ledger ledger = findOne(id, userId);
        if (ledger == null)
            return null;

        if (!userId.equals(ledger.participantId)) {
            throw new SecurityException("Apenas o participante pode aceitar a dívida.");
        }

        if (ledger.status != LedgerStatus.PENDING) {
            throw new IllegalStateException("Esta dívida não está pendente de aceitação.");
        }

        ledger.status = LedgerStatus.ACCEPTED;
        return ledger;
    }

    @Transactional
    public Ledger reject(String id, String userId) {
        Ledger ledger = findOne(id, userId);
        if (ledger == null)
            return null;

        if (!userId.equals(ledger.participantId)) {
            throw new SecurityException("Apenas o participante pode recusar a dívida.");
        }

        if (ledger.status != LedgerStatus.PENDING) {
            throw new IllegalStateException("Esta dívida não está pendente de aceitação.");
        }

        ledger.status = LedgerStatus.REJECTED;
        return ledger;
    }

    @Transactional
    public boolean delete(String id, String userId) {
        Ledger ledger = findOne(id, userId);
        if (ledger == null)
            return false;

        // Apenas o dono pode deletar (regra atual do NestJS)
        if (!ledger.ownerId.equals(userId)) {
            throw new SecurityException("Apenas o dono pode deletar.");
        }

        return Ledger.deleteById(id);
    }
}
