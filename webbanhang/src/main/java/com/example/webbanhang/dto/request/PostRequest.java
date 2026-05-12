package com.example.webbanhang.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class PostRequest {

    @NotBlank(message = "Tiêu đề bài viết không được để trống")
    @Size(max = 255, message = "Tiêu đề tối đa 255 ký tự")
    private String title;

    @NotBlank(message = "Nội dung bài viết không được để trống")
    private String content;

    @Size(max = 500, message = "Tóm tắt tối đa 500 ký tự")
    private String summary;

    /** Danh sách ảnh đính kèm bài viết */
    @Valid
    private List<PostImageRequest> images = new ArrayList<>();

    /**
     * Danh sách sản phẩm gắn vào bài viết.
     * Mỗi phần tử chứa productId + displayOrder + note.
     */
    @Valid
    private List<PostProductRequest> products = new ArrayList<>();
}