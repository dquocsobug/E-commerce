package com.example.webbanhang.repository;

import com.example.webbanhang.entity.PostImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostImageRepository extends JpaRepository<PostImage, Integer> {

    List<PostImage> findByPostPostIdOrderByDisplayOrderAsc(Integer postId);

    Optional<PostImage> findByPostPostIdAndIsMainTrue(Integer postId);

    @Query("""
        SELECT pi
        FROM PostImage pi
        WHERE pi.post.postId IN :postIds
        ORDER BY pi.post.postId ASC, pi.displayOrder ASC
        """)
    List<PostImage> findByPostIdsOrderByDisplayOrderAsc(
            @Param("postIds") List<Integer> postIds
    );

    @Query("""
        SELECT pi
        FROM PostImage pi
        WHERE pi.post.postId IN :postIds
          AND pi.isMain = true
        """)
    List<PostImage> findMainImagesByPostIds(
            @Param("postIds") List<Integer> postIds
    );

    long countByPostPostId(Integer postId);

    @Modifying
    @Query("UPDATE PostImage pi SET pi.isMain = false WHERE pi.post.postId = :postId")
    void clearMainImageByPostId(@Param("postId") Integer postId);

    @Modifying
    @Query("DELETE FROM PostImage pi WHERE pi.post.postId = :postId")
    void deleteByPostPostId(@Param("postId") Integer postId);
}