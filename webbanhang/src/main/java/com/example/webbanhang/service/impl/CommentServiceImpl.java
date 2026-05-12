package com.example.webbanhang.service.impl;

import com.example.webbanhang.dto.request.CommentRequest;
import com.example.webbanhang.dto.request.UpdateCommentRequest;
import com.example.webbanhang.dto.response.CommentResponse;
import com.example.webbanhang.dto.response.PageResponse;
import com.example.webbanhang.dto.response.UserSummaryResponse;
import com.example.webbanhang.entity.Comment;
import com.example.webbanhang.entity.Post;
import com.example.webbanhang.entity.User;
import com.example.webbanhang.enums.PostStatus;
import com.example.webbanhang.exception.BadRequestException;
import com.example.webbanhang.exception.ForbiddenException;
import com.example.webbanhang.exception.ResourceNotFoundException;
import com.example.webbanhang.repository.CommentRepository;
import com.example.webbanhang.repository.PostRepository;
import com.example.webbanhang.repository.UserRepository;
import com.example.webbanhang.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    private CommentResponse toResponse(Comment comment) {
        User u = comment.getUser();
        return CommentResponse.builder()
                .commentId(comment.getCommentId())
                .user(UserSummaryResponse.builder()
                        .userId(u.getUserId())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .build())
                .postId(comment.getPost().getPostId())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> getByPost(Integer postId, Pageable pageable) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post", postId));

        if (post.getStatus() != PostStatus.APPROVED) {
            throw new BadRequestException("Bài viết không tồn tại hoặc chưa được duyệt");
        }

        Page<Comment> page = commentRepository.findByPostPostId(postId, pageable);

        List<CommentResponse> content = page.getContent()
                .stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.of(page, content);
    }

    @Override
    @Transactional
    public CommentResponse create(Integer userId, CommentRequest request) {
        Post post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new ResourceNotFoundException("Post", request.getPostId()));

        if (post.getStatus() != PostStatus.APPROVED) {
            throw new BadRequestException("Chỉ có thể bình luận bài viết đã được duyệt");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Comment comment = Comment.builder()
                .user(user)
                .post(post)
                .content(request.getContent())
                .build();

        return toResponse(commentRepository.save(comment));
    }

    @Override
    @Transactional
    public CommentResponse update(Integer userId, Integer commentId, UpdateCommentRequest request) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", commentId));

        if (!comment.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền sửa bình luận này");
        }

        comment.setContent(request.getContent());
        return toResponse(commentRepository.save(comment));
    }

    @Override
    @Transactional
    public void delete(Integer userId, Integer commentId, boolean isAdmin) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", commentId));

        if (!isAdmin && !comment.getUser().getUserId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền xóa bình luận này");
        }

        commentRepository.delete(comment);
    }
}