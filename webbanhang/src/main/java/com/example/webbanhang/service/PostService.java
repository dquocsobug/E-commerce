package com.example.webbanhang.service;

import com.example.webbanhang.dto.request.PostRequest;
import com.example.webbanhang.dto.request.ReviewPostRequest;
import com.example.webbanhang.dto.response.PageResponse;
import com.example.webbanhang.dto.response.PostResponse;
import com.example.webbanhang.dto.response.PostSummaryResponse;
import com.example.webbanhang.enums.PostStatus;
import org.springframework.data.domain.Pageable;

public interface PostService {

    PageResponse<PostSummaryResponse> getPublishedPosts(String keyword, Pageable pageable);

    PostResponse getPublishedPost(Integer postId);

    PageResponse<PostSummaryResponse> getMyPosts(Integer userId, PostStatus status, Pageable pageable);

    PostResponse getMyPost(Integer userId, Integer postId);

    PostResponse create(Integer userId, PostRequest request);

    PostResponse update(Integer userId, Integer postId, PostRequest request);

    PostResponse submit(Integer userId, Integer postId);

    void delete(Integer userId, Integer postId);

    PageResponse<PostSummaryResponse> adminGetAll(PostStatus status,
                                                  Integer authorId,
                                                  String keyword,
                                                  Pageable pageable);

    PostResponse adminUpdate(Integer postId, PostRequest request);

    PostResponse reviewPost(Integer postId, ReviewPostRequest request);

    void adminDelete(Integer postId);
}