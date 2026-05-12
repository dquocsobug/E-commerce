package com.example.webbanhang.config;

import com.example.webbanhang.security.JwtAccessDeniedHandler;
import com.example.webbanhang.security.JwtAuthenticationEntryPoint;
import com.example.webbanhang.security.JwtAuthenticationFilter;
import com.example.webbanhang.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final JwtAccessDeniedHandler accessDeniedHandler;
    private final UserDetailsServiceImpl userDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))

                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(HttpMethod.POST,
                                "/auth/register",
                                "/auth/login").permitAll()

                        .requestMatchers(HttpMethod.GET,
                                "/products",
                                "/products/**",
                                "/categories",
                                "/categories/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/posts").permitAll()
                        .requestMatchers(HttpMethod.GET, "/posts/{postId:[0-9]+}").permitAll()

                        .requestMatchers(HttpMethod.GET, "/comments/post/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/reviews/product/**").permitAll()

                        .requestMatchers(HttpMethod.GET,
                                "/promotions/active",
                                "/promotions/{promotionId:[0-9]+}").permitAll()

                        .requestMatchers(HttpMethod.GET, "/users/me").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/users/me").authenticated()

                        .requestMatchers(HttpMethod.GET,
                                "/users",
                                "/users/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.PUT,
                                "/users/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.DELETE,
                                "/users/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST,
                                "/users/upgrade-loyal").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/products", "/products/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/products/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/products/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/products/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/categories", "/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/categories/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST,
                                "/promotions",
                                "/promotions/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/promotions/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/promotions/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/promotions").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/vouchers/my").authenticated()
                        .requestMatchers(HttpMethod.POST, "/vouchers/preview").authenticated()

                        .requestMatchers(HttpMethod.POST,
                                "/vouchers",
                                "/vouchers/assign").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/vouchers/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/vouchers/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET,
                                "/vouchers",
                                "/vouchers/{voucherId:[0-9]+}",
                                "/vouchers/{voucherId:[0-9]+}/users").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/orders").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/orders/{orderId:[0-9]+}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH,
                                "/orders/{orderId:[0-9]+}/status").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/posts/admin").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH,
                                "/posts/{postId:[0-9]+}/review").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE,
                                "/posts/{postId:[0-9]+}").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/posts")
                        .hasAnyRole("WRITER", "LOYAL_CUSTOMER", "ADMIN")

                        .requestMatchers(HttpMethod.GET,
                                "/posts/my",
                                "/posts/my/**")
                        .hasAnyRole("WRITER", "LOYAL_CUSTOMER", "ADMIN")

                        .requestMatchers(HttpMethod.PUT, "/posts/my/**")
                        .hasAnyRole("WRITER", "LOYAL_CUSTOMER", "ADMIN")

                        .requestMatchers(HttpMethod.PATCH, "/posts/my/**")
                        .hasAnyRole("WRITER", "LOYAL_CUSTOMER", "ADMIN")

                        .requestMatchers(HttpMethod.DELETE, "/posts/my/**")
                        .hasAnyRole("WRITER", "LOYAL_CUSTOMER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/payments/momo/create").authenticated()
                        .requestMatchers(HttpMethod.POST, "/payments/momo/ipn").permitAll()

                        .requestMatchers(HttpMethod.POST, "/ai/chat").permitAll()

                        .anyRequest().authenticated()
                )

                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOriginPatterns(List.of(
                "http://localhost:3000",
                "http://localhost:5173",
                "https://e-commerce-jet-zeta-11.vercel.app",
                "https://techstore-quoc.vercel.app"
        ));

        config.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With"
        ));

        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }
}