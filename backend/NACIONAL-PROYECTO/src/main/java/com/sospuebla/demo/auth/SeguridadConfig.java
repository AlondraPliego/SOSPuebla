package com.sospuebla.demo.auth;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SeguridadConfig implements WebMvcConfigurer {
  private final SeguridadInterceptor interceptor;

  public SeguridadConfig(SeguridadInterceptor interceptor) {
    this.interceptor = interceptor;
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(interceptor)
        .addPathPatterns("/**")
        .excludePathPatterns("/ws/**", "/error", "/actuator/**");
  }
}