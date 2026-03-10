package com.myfinance.friend;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.myfinance.user.User;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "friends", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "friend_id" })
})
public class Friend extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public String id;

    @Column(name = "user_id", nullable = false)
    public String userId;

    @Column(name = "friend_id", nullable = false)
    public String friendId;

    @ManyToOne
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({ "passwordHash", "createdAt", "updatedAt" })
    public User user;

    @ManyToOne
    @JoinColumn(name = "friend_id", insertable = false, updatable = false)
    @JsonIgnoreProperties({ "passwordHash", "createdAt", "updatedAt" })
    public User friend;
}
