package com.myfinance.user;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UserService {

    public User findById(String id) {
        return User.findById(id);
    }
}
