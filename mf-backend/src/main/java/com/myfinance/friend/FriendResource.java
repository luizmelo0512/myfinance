package com.myfinance.friend;

import com.myfinance.friend.dto.LinkFriendDTO;
import com.myfinance.user.User;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/friends")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("User")
public class FriendResource {

    @Inject
    FriendService friendService;

    @Inject
    JsonWebToken jwt;

    @POST
    @Path("/link")
    public Response linkUserByEmail(@Valid LinkFriendDTO dto) {
        String userId = jwt.getSubject();

        try {
            Friend friend = friendService.linkUserByEmail(userId, dto.email);

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("message", "Usuário vinculado com sucesso!");
            responseBody.put("friend", friend);

            return Response.status(Response.Status.CREATED).entity(responseBody).build();
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return Response.status(Response.Status.BAD_REQUEST).entity(error).build();
        }
    }

    @GET
    public Response listFriends() {
        String userId = jwt.getSubject();
        List<User> friends = friendService.listFriends(userId);
        return Response.ok(friends).build();
    }
}
