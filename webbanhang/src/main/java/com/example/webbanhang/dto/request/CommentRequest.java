package com.example.webbanhang.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommentRequest {

    @NotNull(message = "PostId không được để trống")
    private Integer postId;

    @NotBlank(message = "Nội dung bình luận không được để trống")
    private String content;
}