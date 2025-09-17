<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Constants
define('HOSTNAME', 'localhost');
define('PORT', 9090);
define('STATIC_PATH', realpath(__DIR__ . '/../frontend'));
define('JWT_SIGNING_KEY_INTERACTIVE_EMBEDDING', 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
define('METABASE_URL', 'http://localhost:3000');

// Function to generate JWT token
function sign_user_token($user) {
    return JWT::encode($user, JWT_SIGNING_KEY_INTERACTIVE_EMBEDDING, 'HS256');
}

// Function to handle requests
function handle_request() {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $query_string = parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY);
    parse_str($query_string, $query_params);

    if ($uri === '/api/health') {
        handle_health_check();
    } elseif ($uri === '/api/auth') {
        handle_auth($query_params);
    } else {
        handle_static_files($uri);
    }
}

// Health check handler
function handle_health_check() {
    http_response_code(200);
    header('Content-Type: text/plain');
    echo 'OK';
}

// Authentication handler
function handle_auth($query_params) {
    $user = [
        'email' => 'someone@somedomain.com',
        'first_name' => 'Someone',
        'last_name' => 'Somebody',
        'exp' => time() + 3600,
        'groups' => ['viewer']
    ];
    
    $token = sign_user_token($user);
    
    $is_sdk_request = isset($query_params['response']) && $query_params['response'] === 'json';
    
    if ($is_sdk_request) {
        // For SDK requests, return a JSON object with the JWT.
        error_log("SDK request detected, returning JWT in JSON response");
        http_response_code(200);
        header('Content-Type: application/json');
        echo json_encode(['jwt' => $token]);
    } else {
        error_log("Non-SDK request detected, redirecting to Metabase SSO");
        // For interactive embedding, construct the Metabase SSO URL
        // and redirect the user's browser to it.
        $redirect_params = ['jwt' => $token];
        if (isset($query_params['return_to'])) {
            $redirect_params['return_to'] = $query_params['return_to'];
        }
        
        $redirect_url = METABASE_URL . '/auth/sso?' . http_build_query($redirect_params);
        header("Location: $redirect_url", true, 302);
    }
    exit();
}

// Static file handler
function handle_static_files($uri) {
    $file_path = prepare_file($uri);
    
    if ($file_path['found']) {
        http_response_code(200);
        header('Content-Type: text/html; charset=UTF-8');
        readfile($file_path['stream_path']);
    } else {
        http_response_code(404);
        header('Content-Type: text/html; charset=UTF-8');
        readfile(STATIC_PATH . '/404.html');
    }
}

// Prepare file function
function prepare_file($uri) {
    $file_path = rtrim(STATIC_PATH . $uri, '/');
    if (is_dir($file_path)) {
        $file_path .= '/index.html';
    }
    
    $exists = file_exists($file_path);
    return [
        'found' => $exists,
        'stream_path' => $exists ? $file_path : STATIC_PATH . '/404.html'
    ];
}

// Start the server
handle_request();
