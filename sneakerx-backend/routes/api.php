<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\AuthController;

// middleware
Route::middleware('auth:sanctum')->get('/products', [ProductController::class, 'index']);


// User login
Route::post('/login', [AuthController::class, 'login']);


// Product-related routes
Route::get('/products', [ProductController::class, 'index']);

// User registration
Route::post('/register', [AuthController::class, 'register']);
