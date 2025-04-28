<?php
// Simple PHP script to handle email registration
header('Content-Type: application/json');

// Allow CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get the JSON data from the request
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Validate the data
if (!isset($data['email']) || empty($data['email'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Email is required']);
    exit();
}

// Validate email format
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email format']);
    exit();
}

// Get the name (optional)
$name = isset($data['name']) ? $data['name'] : '';

// Create a data file to store the emails if it doesn't exist
$dataFile = __DIR__ . '/interested_users.csv';
$fileExists = file_exists($dataFile);

// Open the file for appending
$file = fopen($dataFile, 'a');

// Add headers if the file is new
if (!$fileExists) {
    fputcsv($file, ['email', 'name', 'created_at']);
}

// Add the new entry
fputcsv($file, [
    $data['email'],
    $name,
    date('Y-m-d H:i:s')
]);

// Close the file
fclose($file);

// Return success response
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Thank you for your interest! We\'ll notify you when we launch.'
]);
