package com.myfinance.ledger.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateLedgerDTO {

    @NotBlank(message = "Título é obrigatório")
    @Size(min = 3, max = 50, message = "Título deve ter entre 3 e 50 caracteres")
    public String title;

    @NotBlank(message = "Nome do devedor é obrigatório")
    public String targetName;

    public String participantId;
}
