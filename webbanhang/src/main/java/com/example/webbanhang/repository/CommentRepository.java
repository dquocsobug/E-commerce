package com.example.webbanhang.repository;

import com.example.webbanhang.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Integer> {

    Page<Comment> findByPostPostId(Integer postId, Pageable pageable);

    Page<Comment> findByUserUserId(Integer userId, Pageable pageable);

    long countByPostPostId(Integer postId);

    @Query("""
        SELECT c.post.postId, COUNT(c.commentId)
        FROM Comment c
        WHERE c.post.postId IN :postIds
        GROUP BY c.post.postId
    """)
    List<Object[]> countByPostIds(@Param("postIds") List<Integer> postIds);

    boolean existsByCommentIdAndUserUserId(Integer commentId, Integer userId);

    void deleteByPostPostId(Integer postId);

    void deleteByUserUserId(Integer userId);

    @Query(
            value = """
            SELECT c
            FROM Comment c
            LEFT JOIN FETCH c.user u
            LEFT JOIN FETCH c.post p
            WHERE c.post.postId = :postId
        """,
            countQuery = """
            SELECT COUNT(c)
            FROM Comment c
            WHERE c.post.postId = :postId
        """
    )
    Page<Comment> findByPostPostIdWithUserAndPost(
            @Param("postId") Integer postId,
            Pageable pageable
    );

    @Query("""
        SELECT c
        FROM Comment c
        LEFT JOIN FETCH c.user u
        LEFT JOIN FETCH c.post p
        WHERE c.commentId = :commentId
    """)
    Optional<Comment> findByIdWithUserAndPost(@Param("commentId") Integer commentId);
}