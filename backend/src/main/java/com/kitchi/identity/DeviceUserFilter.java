package com.kitchi.identity;

import com.kitchi.error.ApiError;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class DeviceUserFilter extends OncePerRequestFilter {

    static final String HEADER = "X-Device-Id";
    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
    private static final int MAX_BODY_BYTES = 65_536;

    private final UserAccountService users;
    private final ObjectMapper json;

    public DeviceUserFilter(UserAccountService users, ObjectMapper json) {
        this.users = users;
        this.json = json;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }
        if (request.getContentLength() > MAX_BODY_BYTES) {
            write(response, 413, "Request is too large");
            return;
        }
        String header = request.getHeader(HEADER);
        if (header == null || !UUID_PATTERN.matcher(header).matches()) {
            write(response, 400, "X-Device-Id must be a UUID");
            return;
        }
        try {
            UserAccountService.Resolved resolved = users.resolve(UUID.fromString(header), request.getHeader("X-Timezone"));
            CurrentUser.set(resolved.userId(), resolved.zone());
            chain.doFilter(request, response);
        } finally {
            CurrentUser.clear();
        }
    }

    private void write(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        json.writeValue(response.getWriter(), new ApiError(Instant.now(), status, message, Map.of()));
    }
}
