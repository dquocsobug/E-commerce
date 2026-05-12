package com.example.webbanhang.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resource, Integer id) {
        super(resource + " không tìm thấy với id: " + id);
    }

    public ResourceNotFoundException(String resource, String field, Object value) {
        super(resource + " không tìm thấy với " + field + ": " + value);
    }
}