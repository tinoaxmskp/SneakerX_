<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{

    public function login(Request $request)
    {
        try {
            // Validate incoming request
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            // Attempt login
            if (!Auth::attempt($request->only('email', 'password'))) {
                return response()->json(['error' => 'Invalid login credentials.'], 401);
            }

            // Retrieve authenticated user
            $user = Auth::user();

            // Generate API token (if using Sanctum or Passport)
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful!',
                'token' => $token,
                'user' => $user,
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred during login.'], 500);
        }
    }

    public function register(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|unique:users',
                'password' => 'required|string|min:6'
            ]);

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            return response()->json(['message' => 'User registered successfully.', 'user' => $user], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred during registration.'], 500);
        }
    }
}
