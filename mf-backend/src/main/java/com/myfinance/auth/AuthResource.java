package com.myfinance.auth;

import com.myfinance.auth.dto.AuthResponse;
import com.myfinance.auth.dto.SignInRequest;
import com.myfinance.auth.dto.SignUpRequest;
import com.myfinance.user.User;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.CookieParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Cookie;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.NewCookie;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    JwtService jwtService;

    @Inject
    JsonWebToken jwt;

    @POST
    @Path("/sign-up/email")
    @Transactional
    public Response signUp(@Valid SignUpRequest request) {
        if (User.findByEmail(request.email) != null) {
            return Response.status(400)
                    .entity("{\"code\":\"EMAIL_EXISTS\", \"message\":\"O e-mail informado já está em uso.\"}")
                    .build();
        }

        User user = new User();
        user.name = request.name;
        user.email = request.email;
        user.passwordHash = BcryptUtil.bcryptHash(request.password);
        user.persist();

        String token = jwtService.generateToken(user.id, user.email, user.name);

        return Response.ok(new AuthResponse(token, user))
                .cookie(createSessionCookie(token, 10800)) // 3 horas
                .build();
    }

    @POST
    @Path("/sign-in/email")
    @Transactional
    public Response signIn(@Valid SignInRequest request) {
        User user = User.findByEmail(request.email);

        if (user == null || !BcryptUtil.matches(request.password, user.passwordHash)) {
            // Retorna o código que o frontend espera
            return Response.status(401)
                    .entity("{\"code\":\"INVALID_EMAIL_OR_PASSWORD\", \"message\":\"Email ou senha inválidos.\"}")
                    .build();
        }

        String token = jwtService.generateToken(user.id, user.email, user.name);

        return Response.ok(new AuthResponse(token, user))
                .cookie(createSessionCookie(token, 10800)) // 3h
                .build();
    }

    @POST
    @Path("/sign-out")
    public Response signOut() {
        return Response.ok()
                .cookie(createSessionCookie("", 0)) // Deleta o cookie
                .build();
    }

    private NewCookie createSessionCookie(String token, int maxAge) {
        // secure = false para localhost, mas o ideal em prod é true
        boolean secure = false;

        return new NewCookie(
                "mf_session_token",
                token,
                "/",
                null, // domain
                "Session Token",
                maxAge,
                secure,
                true // httpOnly
        );
    }
}
