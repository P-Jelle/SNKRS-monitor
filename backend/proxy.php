<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$apiUrl = "https://api.nike.com/product_feed/threads/v3/";

$queryString = $_SERVER['QUERY_STRING'];

$fullUrl = $apiUrl . '?' . $queryString;

$ch = curl_init($fullUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json"
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode);
echo $response;
?>
