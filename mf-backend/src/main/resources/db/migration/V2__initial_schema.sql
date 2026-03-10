-- V1__initial_schema.sql

CREATE TABLE users (
    id VARCHAR2(36) NOT NULL PRIMARY KEY,
    name VARCHAR2(255) NOT NULL,
    email VARCHAR2(255) NOT NULL UNIQUE,
    password_hash VARCHAR2(255) NOT NULL,
    email_verified NUMBER(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

CREATE TABLE ledgers (
    id VARCHAR2(36) NOT NULL PRIMARY KEY,
    title VARCHAR2(255) NOT NULL,
    owner_id VARCHAR2(36) NOT NULL,
    participant_id VARCHAR2(36),
    target_name VARCHAR2(255) NOT NULL,
    status VARCHAR2(20) DEFAULT 'ACCEPTED' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE transactions (
    id VARCHAR2(36) NOT NULL PRIMARY KEY,
    amount NUMBER(10,2) NOT NULL,
    type VARCHAR2(20) NOT NULL,
    description VARCHAR2(500),
    transaction_date TIMESTAMP,
    created_by_id VARCHAR2(36),
    created_by_name VARCHAR2(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ledger_id VARCHAR2(36) NOT NULL,
    CONSTRAINT fk_transaction_ledger FOREIGN KEY (ledger_id) REFERENCES ledgers(id) ON DELETE CASCADE
);

CREATE TABLE friends (
    id VARCHAR2(36) NOT NULL PRIMARY KEY,
    user_id VARCHAR2(36) NOT NULL,
    friend_id VARCHAR2(36) NOT NULL,
    CONSTRAINT uk_friends_user_friend UNIQUE (user_id, friend_id),
    CONSTRAINT fk_friends_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_friends_friend FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
);
