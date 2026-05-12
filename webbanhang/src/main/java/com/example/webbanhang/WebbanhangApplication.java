package com.example.webbanhang;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement   // bật @Transactional trong Service
@EnableJpaAuditing             // hỗ trợ audit (createdAt, updatedAt tự động)
public class WebbanhangApplication {

    public static void main(String[] args) {
        SpringApplication.run(WebbanhangApplication.class, args);
        System.out.println(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("123456"));
    }

}