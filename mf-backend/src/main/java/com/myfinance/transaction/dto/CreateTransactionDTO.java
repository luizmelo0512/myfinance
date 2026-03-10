package com.myfinance.transaction.dto;

import com.myfinance.transaction.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateTransactionDTO {

    @NotBlank(message = "ID da conta é obrigatório")
    public String ledgerId;

    @NotNull(message = "Valor é obrigatório")
    @DecimalMin(value = "0.01", message = "O valor deve ser de pelo menos 0.01")
    public BigDecimal amount;

    @NotNull(message = "Tipo de transação é obrigatório")
    public TransactionType type;

    public String description;

    public LocalDate transactionDate;
}
