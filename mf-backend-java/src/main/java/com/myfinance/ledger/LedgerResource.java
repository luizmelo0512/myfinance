package com.myfinance.ledger;

import com.myfinance.ledger.dto.CreateLedgerDTO;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/ledger")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RolesAllowed("User")
public class LedgerResource {

    @Inject
    LedgerService ledgerService;

    @Inject
    JsonWebToken jwt;

    @POST
    public Response create(@Valid CreateLedgerDTO dto) {
        String userId = jwt.getSubject();
        Ledger ledger = ledgerService.create(dto, userId);
        return Response.status(Response.Status.CREATED).entity(ledger).build();
    }

    @GET
    public Response findAll() {
        String userId = jwt.getSubject();
        List<Ledger> ledgers = ledgerService.findAll(userId);
        return Response.ok(ledgers).build();
    }

    @GET
    @Path("/{id}")
    public Response findOne(@PathParam("id") String id) {
        String userId = jwt.getSubject();
        try {
            Ledger ledger = ledgerService.findOne(id, userId);
            if (ledger == null) {
                return Response.status(Response.Status.NOT_FOUND).build();
            }
            return Response.ok(ledger).build();
        } catch (SecurityException e) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("message", e.getMessage()))
                    .build();
        }
    }

    @PATCH
    @Path("/{id}/accept")
    public Response accept(@PathParam("id") String id) {
        String userId = jwt.getSubject();
        try {
            Ledger ledger = ledgerService.accept(id, userId);
            if (ledger == null)
                return Response.status(Response.Status.NOT_FOUND).build();
            return Response.ok(ledger).build();
        } catch (SecurityException | IllegalStateException e) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("message", e.getMessage()))
                    .build();
        }
    }

    @PATCH
    @Path("/{id}/reject")
    public Response reject(@PathParam("id") String id) {
        String userId = jwt.getSubject();
        try {
            Ledger ledger = ledgerService.reject(id, userId);
            if (ledger == null)
                return Response.status(Response.Status.NOT_FOUND).build();
            return Response.ok(ledger).build();
        } catch (SecurityException | IllegalStateException e) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("message", e.getMessage()))
                    .build();
        }
    }

    @DELETE
    @Path("/{id}")
    public Response remove(@PathParam("id") String id) {
        String userId = jwt.getSubject();
        try {
            boolean deleted = ledgerService.delete(id, userId);
            if (!deleted)
                return Response.status(Response.Status.NOT_FOUND).build();
            return Response.noContent().build();
        } catch (SecurityException e) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("message", e.getMessage()))
                    .build();
        }
    }
}
