package com.myfinance.transaction;

import com.myfinance.transaction.dto.CreateTransactionDTO;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.Map;

@Path("/transactions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("User")
public class TransactionResource {

    @Inject
    TransactionService transactionService;

    @Inject
    JsonWebToken jwt;

    @POST
    public Response create(@Valid CreateTransactionDTO dto) {
        String userId = jwt.getSubject();
        String userName = jwt.getClaim("name");

        try {
            Transaction transaction = transactionService.create(dto, userId, userName);
            return Response.status(Response.Status.CREATED).entity(transaction).build();
        } catch (BadRequestException | ForbiddenException e) {
            int status = e instanceof ForbiddenException ? 403 : 400;
            return Response.status(status).entity(Map.of("message", e.getMessage())).build();
        }
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") String id) {
        String userId = jwt.getSubject();

        try {
            boolean deleted = transactionService.delete(id, userId);
            if (!deleted) {
                return Response.status(Response.Status.NOT_FOUND).build();
            }
            return Response.noContent().build();
        } catch (ForbiddenException e) {
            return Response.status(Response.Status.FORBIDDEN).entity(Map.of("message", e.getMessage())).build();
        }
    }
}
