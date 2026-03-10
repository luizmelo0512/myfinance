package com.myfinance.user;

import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed("User") // Exige JWT válido
public class UserResource {

    @Inject
    UserService userService;

    @Inject
    org.eclipse.microprofile.jwt.JsonWebToken jwt;

    @GET
    @Path("/me")
    public Response me() {
        String email = jwt.getClaim("email");
        if (email == null)
            return Response.status(401).build();

        com.myfinance.user.User user = com.myfinance.user.User.findByEmail(email);
        if (user == null)
            return Response.status(401).build();

        return Response.ok(user).build();
    }

    @GET
    @Path("/{id}")
    public Response getUser(@PathParam("id") String id) {
        User user = userService.findById(id);
        if (user == null) {
            return Response.status(404).build();
        }
        return Response.ok(user).build();
    }
}
