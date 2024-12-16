<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

class ProductController extends Controller
{
    public function index()
    {    
        try {
            $products = Product::all();
            return response()->json($products, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'An error occurred while loading products.'], 500);
        }
    }
}
