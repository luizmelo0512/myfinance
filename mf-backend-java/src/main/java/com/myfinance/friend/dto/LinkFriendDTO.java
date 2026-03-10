package com.myfinance.friend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class LinkFriendDTO {

    @NotBlank(message = "Email é obrigatório.")
    @Email(message = "Email inválido.")
    public String email;
}
