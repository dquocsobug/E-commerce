package com.example.webbanhang.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class OpenAiConfig {

    @Bean
    public RestTemplate restTemplate() {

        SimpleClientHttpRequestFactory factory =
                new SimpleClientHttpRequestFactory();

        // thời gian kết nối tối đa
        factory.setConnectTimeout(5000);

        // thời gian chờ phản hồi tối đa
        factory.setReadTimeout(20000);

        return new RestTemplate(factory);
    }
}