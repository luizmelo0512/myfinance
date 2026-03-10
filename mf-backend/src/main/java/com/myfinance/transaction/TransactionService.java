package com.myfinance.transaction;

import com.myfinance.ledger.Ledger;
import com.myfinance.ledger.LedgerStatus;
import com.myfinance.transaction.dto.CreateTransactionDTO;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;

@ApplicationScoped
public class TransactionService {

    @Transactional
    public Transaction create(CreateTransactionDTO dto, String userId, String userName) {
        Ledger ledger = Ledger.findById(dto.ledgerId);

        if (ledger == null) {
            throw new BadRequestException("Conta inexistente.");
        }

        // Regra de aceite
        if (ledger.status != LedgerStatus.ACCEPTED) {
            throw new BadRequestException(
                    "Não é possível adicionar transações. A dívida está pendente de aceite ou foi recusada.");
        }

        // Validação de segurança: o Ledger pertence a quem está logado?
        if (!ledger.ownerId.equals(userId) && !userId.equals(ledger.participantId)) {
            throw new ForbiddenException("Você não tem permissão para alterar esta conta.");
        }

        Transaction transaction = new Transaction();
        transaction.ledger = ledger;
        transaction.amount = dto.amount;
        transaction.type = dto.type;
        transaction.description = dto.description;
        transaction.transactionDate = dto.transactionDate != null ? dto.transactionDate.atStartOfDay()
                : java.time.LocalDateTime.now();
        transaction.createdById = userId;
        transaction.createdByName = userName;

        transaction.persist();
        return transaction;
    }

    @Transactional
    public boolean delete(String id, String userId) {
        Transaction transaction = Transaction.findById(id);
        if (transaction == null)
            return false;

        // Recupera o ledger
        Ledger ledger = transaction.ledger;
        if (!ledger.ownerId.equals(userId) && !userId.equals(ledger.participantId)) {
            throw new ForbiddenException("Você não tem permissão para remover esta transação.");
        }

        return Transaction.deleteById(id);
    }
}
