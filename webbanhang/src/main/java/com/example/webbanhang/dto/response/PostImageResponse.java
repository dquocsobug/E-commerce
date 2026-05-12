package com.example.webbanhang.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PostImageResponse {

    private final Integer imageId;
    private final String  imageUrl;
    private final Boolean isMain;
    private final Integer displayOrder;
}