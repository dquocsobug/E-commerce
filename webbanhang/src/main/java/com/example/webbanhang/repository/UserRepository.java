package com.example.webbanhang.repository;

import com.example.webbanhang.entity.User;
import com.example.webbanhang.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(Role role);

    Optional<User> findFirstByRole(Role role);

    Page<User> findByRoleOrderByCreatedAtDesc(Role role, Pageable pageable);

    @Query(value = """
    SELECT *
    FROM Users u
    WHERE (
        CAST(:keyword AS text) IS NULL
        OR LOWER(u.FullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%'))
        OR LOWER(u.Email) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%'))
        OR u.Phone LIKE CONCAT('%', CAST(:keyword AS text), '%')
    )
    AND (
        CAST(:role AS text) IS NULL
        OR u.Role = CAST(:role AS text)
    )
    ORDER BY u.CreatedAt DESC
    """,
            countQuery = """
    SELECT COUNT(*)
    FROM Users u
    WHERE (
        CAST(:keyword AS text) IS NULL
        OR LOWER(u.FullName) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%'))
        OR LOWER(u.Email) LIKE LOWER(CONCAT('%', CAST(:keyword AS text), '%'))
        OR u.Phone LIKE CONCAT('%', CAST(:keyword AS text), '%')
    )
    AND (
        CAST(:role AS text) IS NULL
        OR u.Role = CAST(:role AS text)
    )
    """,
            nativeQuery = true)
    Page<User> findWithFilters(
            @Param("keyword") String keyword,
            @Param("role") String role,
            Pageable pageable
    );
    @Modifying
    @Query("UPDATE User u SET u.role = :role WHERE u.userId = :userId")
    void updateRole(
            @Param("userId") Integer userId,
            @Param("role") Role role
    );

    @Query("""
        SELECT DISTINCT u FROM User u
        JOIN u.orders o
        WHERE u.role = 'CUSTOMER'
          AND o.status = 'DELIVERED'
          AND o.createdAt <= :cutoff
        """)
    List<User> findEligibleForLoyalUpgrade(@Param("cutoff") LocalDateTime cutoff);

    long countByRole(Role role);
}