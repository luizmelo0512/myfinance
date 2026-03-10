package com.myfinance.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class SignInRequest {

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    public String email;

    @NotBlank(message = "Senha é obrigatória")
    public String password;
}
