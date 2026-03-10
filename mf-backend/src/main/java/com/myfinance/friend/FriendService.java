package com.myfinance.friend;

import com.myfinance.user.User;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class FriendService {

    @Transactional
    public Friend linkUserByEmail(String userId, String targetEmail) {
        if (targetEmail == null || targetEmail.isBlank()) {
            throw new IllegalArgumentException("Email é obrigatório.");
        }

        User targetUser = User.findByEmail(targetEmail);

        if (targetUser == null) {
            throw new IllegalArgumentException("Usuário não encontrado com este e-mail.");
        }

        if (targetUser.id.equals(userId)) {
            throw new IllegalArgumentException("Você não pode vincular a si mesmo.");
        }

        Friend existingFriend = Friend.find("userId = ?1 and friendId = ?2", userId, targetUser.id).firstResult();

        if (existingFriend != null) {
            // No frontend atual se retorna message "Usuário já está vinculado" com status
            // 200/201
            return existingFriend;
        }

        Friend newFriend = new Friend();
        newFriend.userId = userId;
        newFriend.friendId = targetUser.id;
        newFriend.persist();

        return newFriend;
    }

    public List<User> listFriends(String userId) {
        List<Friend> friendships = Friend.find("userId", userId).list();
        return friendships.stream()
                .map(friend -> friend.friend)
                .collect(Collectors.toList());
    }
}
