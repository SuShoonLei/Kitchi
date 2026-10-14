package com.kitchi.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kitchi.error.ApiError;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class WriteRateLimitFilter extends OncePerRequestFilter {

    private final int limit;
    private final ObjectMapper json;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public WriteRateLimitFilter(@Value("${kitchi.rate-limit.writes-per-minute}") int limit, ObjectMapper json) {
        this.limit = limit;
        this.json = json;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!request.getRequestURI().startsWith("/api/")) {
            return true;
        }
        return "OPTIONS".equals(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String device = request.getHeader(DeviceUserFilter.HEADER);
        if (device == null) {
            chain.doFilter(request, response);
            return;
        }
        if (!allow(device)) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            json.writeValue(response.getWriter(), new ApiError(Instant.now(), 429, "Too many requests", Map.of()));
            return;
        }
        chain.doFilter(request, response);
    }

    private boolean allow(String device) {
        long minute = System.currentTimeMillis() / 60_000L;
        Window window = windows.compute(device, (key, existing) -> {
            if (existing == null || existing.minute != minute) {
                return new Window(minute, 1);
            }
            existing.count++;
            return existing;
        });
        return window.count <= limit;
    }

    private static final class Window {
        private final long minute;
        private int count;

        private Window(long minute, int count) {
            this.minute = minute;
            this.count = count;
        }
    }
}
