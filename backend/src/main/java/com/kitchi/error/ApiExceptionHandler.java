package com.kitchi.error;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fasterxml.jackson.databind.exc.ValueInstantiationException;
import com.kitchi.domain.Cuisine;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiExceptionHandler {

    private final boolean exposeDetails;

    public ApiExceptionHandler(@Value("${kitchi.errors.expose-details}") boolean exposeDetails) {
        this.exposeDetails = exposeDetails;
    }

    @ExceptionHandler(NotFoundException.class)
    ResponseEntity<ApiError> notFound(NotFoundException exception) {
        return body(HttpStatus.NOT_FOUND, exception.getMessage(), Map.of());
    }

    @ExceptionHandler(ConflictException.class)
    ResponseEntity<ApiError> conflict(ConflictException exception) {
        return body(HttpStatus.CONFLICT, exception.getMessage(), Map.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> invalid(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
                fields.putIfAbsent(error.getField(), error.getDefaultMessage() == null ? "Invalid" : error.getDefaultMessage()));
        return body(HttpStatus.BAD_REQUEST, "Check the highlighted fields", fields);
    }

    @ExceptionHandler(FieldException.class)
    ResponseEntity<ApiError> fields(FieldException exception) {
        return body(HttpStatus.BAD_REQUEST, exception.getMessage(), exception.fieldErrors());
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    ResponseEntity<ApiError> queryInvalid(HandlerMethodValidationException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getParameterValidationResults().forEach(result -> {
            String name = result.getMethodParameter().getParameterName();
            String message = result.getResolvableErrors().isEmpty()
                    ? "Invalid value"
                    : result.getResolvableErrors().getFirst().getDefaultMessage();
            if (name != null) {
                fields.put(name, message == null ? "Invalid value" : message);
            }
        });
        return body(HttpStatus.BAD_REQUEST, "Check the highlighted fields", fields);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ApiError> typeMismatch(MethodArgumentTypeMismatchException exception) {
        String name = exception.getName() == null ? "value" : exception.getName();
        return body(HttpStatus.BAD_REQUEST, "Check the highlighted fields", Map.of(name, "Invalid value"));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> unreadable(HttpMessageNotReadableException exception) {
        if (isCuisineProblem(exception)) {
            JsonMappingException mapping = findMapping(exception);
            String field = mapping == null ? "cuisine" : fieldPath(mapping);
            return body(HttpStatus.BAD_REQUEST, "Check the highlighted fields", Map.of(field, "Unknown cuisine"));
        }
        return body(HttpStatus.BAD_REQUEST, "Request body is invalid", Map.of());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiError> integrity(DataIntegrityViolationException exception) {
        return body(HttpStatus.CONFLICT, "That change conflicts with saved data", Map.of());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiError> illegal(IllegalArgumentException exception) {
        String message = exposeDetails && exception.getMessage() != null ? exception.getMessage() : "Request is invalid";
        return body(HttpStatus.BAD_REQUEST, message, Map.of());
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> unexpected(Exception exception) {
        String message = exposeDetails && exception.getMessage() != null
                ? exception.getMessage()
                : "Something went wrong";
        return body(HttpStatus.INTERNAL_SERVER_ERROR, message, Map.of());
    }

    private ResponseEntity<ApiError> body(HttpStatus status, String message, Map<String, String> fields) {
        return ResponseEntity.status(status).body(new ApiError(Instant.now(), status.value(), message, fields));
    }

    private static boolean isCuisineProblem(Throwable error) {
        Throwable current = error;
        while (current != null) {
            if (current instanceof ValueInstantiationException value
                    && value.getType() != null
                    && value.getType().getRawClass() == Cuisine.class) {
                return true;
            }
            if (current instanceof InvalidFormatException invalid && invalid.getTargetType() == Cuisine.class) {
                return true;
            }
            if (current instanceof IllegalArgumentException illegal
                    && illegal.getMessage() != null
                    && illegal.getMessage().toLowerCase().contains("cuisine")) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private static JsonMappingException findMapping(Throwable error) {
        Throwable current = error;
        while (current != null) {
            if (current instanceof JsonMappingException mapping) {
                return mapping;
            }
            current = current.getCause();
        }
        return null;
    }

    private static String fieldPath(JsonMappingException exception) {
        StringBuilder path = new StringBuilder();
        for (JsonMappingException.Reference reference : exception.getPath()) {
            if (reference.getFieldName() != null) {
                if (!path.isEmpty()) {
                    path.append('.');
                }
                path.append(reference.getFieldName());
            }
            if (reference.getIndex() >= 0) {
                path.append('[').append(reference.getIndex()).append(']');
            }
        }
        return path.isEmpty() ? "cuisine" : path.toString();
    }
}
