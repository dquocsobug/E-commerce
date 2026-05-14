package com.example.webbanhang.repository;

import com.example.webbanhang.entity.Post;
import com.example.webbanhang.entity.PostImage;
import com.example.webbanhang.entity.PostProduct;
import com.example.webbanhang.enums.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
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
        SELECT p
        FROM Post p
        WHERE p.status = com.example.webbanhang.enums.PostStatus.APPROVED
          AND (
                :keyword IS NULL
             OR :keyword = ''
             OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(p.summary) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%'))
          )
        """)
    Page<Post> searchPublished(@Param("keyword") String keyword, Pageable pageable);

    @Query("""
        SELECT p
        FROM Post p
        WHERE (:status IS NULL OR p.status = :status)
          AND (:authorId IS NULL OR p.createdBy.userId = :authorId)
          AND (
                :keyword IS NULL
             OR :keyword = ''
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

    /*
     * Detail post: chỉ fetch 1 bag mỗi query để tránh MultipleBagFetchException.
     */
    @Query("""
        SELECT DISTINCT p
        FROM Post p
        LEFT JOIN FETCH p.images
        WHERE p.postId = :postId
        """)
    Optional<Post> findByIdWithImages(@Param("postId") Integer postId);

    @Query("""
        SELECT DISTINCT p
        FROM Post p
        LEFT JOIN FETCH p.postProducts pp
        LEFT JOIN FETCH pp.product prod
        WHERE p.postId = :postId
        """)
    Optional<Post> findByIdWithProducts(@Param("postId") Integer postId);

    /*
     * Batch query cho list page.
     * Dùng sau khi đã lấy Page<Post>, không JOIN FETCH trực tiếp với Pageable.
     */
    @Query("""
        SELECT pi
        FROM PostImage pi
        WHERE pi.post.postId IN :postIds
        ORDER BY pi.post.postId ASC, pi.displayOrder ASC
        """)
    List<PostImage> findImagesByPostIds(@Param("postIds") List<Integer> postIds);

    @Query("""
        SELECT pp
        FROM PostProduct pp
        JOIN FETCH pp.product prod
        WHERE pp.post.postId IN :postIds
        """)
    List<PostProduct> findPostProductsByPostIds(@Param("postIds") List<Integer> postIds);

    /*
     * Batch load author nếu mapper đang gọi p.getCreatedBy().
     * ManyToOne JOIN FETCH theo ids an toàn, không dùng với Pageable trực tiếp.
     */
    @Query("""
        SELECT p
        FROM Post p
        JOIN FETCH p.createdBy
        WHERE p.postId IN :postIds
        """)
    List<Post> findPostsWithAuthorByPostIds(@Param("postIds") List<Integer> postIds);

    long countByStatus(PostStatus status);

    long countByCreatedByUserId(Integer userId);
}