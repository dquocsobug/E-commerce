package com.example.webbanhang.repository;

import com.example.webbanhang.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Integer> {

    Page<Comment> findByPostPostId(Integer postId, Pageable pageable);

    Page<Comment> findByUserUserId(Integer userId, Pageable pageable);

    long countByPostPostId(Integer postId);

    boolean existsByCommentIdAndUserUserId(Integer commentId, Integer userId);

    void deleteByPostPostId(Integer postId);

    void deleteByUserUserId(Integer userId);
}