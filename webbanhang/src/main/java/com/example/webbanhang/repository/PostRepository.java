package com.example.webbanhang.repository;

import com.example.webbanhang.entity.Post;
import com.example.webbanhang.enums.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Integer> {

    Page<Post> findByStatus(PostStatus status, Pageable pageable);

    Page<Post> findByCreatedByUserId(Integer userId, Pageable pageable);

    Page<Post> findByCreatedByUserIdAndStatus(
            Integer userId,
            PostStatus status,
            Pageable pageable
    );

    @Query("""
        SELECT p FROM Post p
        WHERE p.status = com.example.webbanhang.enums.PostStatus.APPROVED
          AND (
                LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(p.summary) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
        """)
    Page<Post> searchPublished(@Param("keyword") String keyword, Pageable pageable);

    @Query("""
        SELECT p FROM Post p
        WHERE (:status IS NULL OR p.status = :status)
          AND (:authorId IS NULL OR p.createdBy.userId = :authorId)
          AND (
                :keyword IS NULL
             OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(p.summary) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
        """)
    Page<Post> findWithFilters(
            @Param("status") PostStatus status,
            @Param("authorId") Integer authorId,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("""
        SELECT DISTINCT p FROM Post p
        LEFT JOIN FETCH p.images
        WHERE p.postId = :postId
        """)
    Optional<Post> findByIdWithImages(@Param("postId") Integer postId);

    @Query("""
        SELECT DISTINCT p FROM Post p
        LEFT JOIN FETCH p.postProducts pp
        LEFT JOIN FETCH pp.product prod
        WHERE p.postId = :postId
        """)
    Optional<Post> findByIdWithProducts(@Param("postId") Integer postId);

    long countByStatus(PostStatus status);

    long countByCreatedByUserId(Integer userId);
}