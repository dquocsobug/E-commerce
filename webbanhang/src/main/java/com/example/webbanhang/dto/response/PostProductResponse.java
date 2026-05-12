package com.example.webbanhang.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PostProductResponse {

    private final Integer                id;
    private final ProductSummaryResponse product;
    private final Integer                displayOrder;
    private final String                 note;
}