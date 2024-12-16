const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();

// CORS settings
app.use(cors({
    origin: 'http://localhost:63342', // Adjust as needed
    credentials: true
}));

app.use(express.json());

// Secret key for JWT
const SECRET_KEY = 'your_secret_key_here';

// Example products
const products = [
    {
        id: 1,
        name: "Sport Shoes",
        brand: "Adidas",
        price: 78,
        description: "High-quality sport shoes for everyday use.",
        image: "img/products/f1.png",
        images: [
            "img/products/f1.png",
            "img/products/f2.png",
            "img/products/f3.png",
            "img/products/f4.png"
        ],
        rating: 5
    },
    {
        id: 2,
        name: "Classic Sneakers",
        brand: "Nike",
        price: 120,
        description: "Comfortable and stylish classic sneakers.",
        image: "img/products/f2.png",
        images: [
            "img/products/f2.png",
            "img/products/f1.png",
            "img/products/f3.png",
            "img/products/f4.png"
        ],
        rating: 4.5
    },
    // Add more products as needed...
];

// In-memory data storage
let users = [
    {
        id: 1,
        fullName: "Test User",
        email: "test@test.com",
        address: "Country Street",
        city: "CityName",
        state: "StateName",
        zip: "12345",
        password: "$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" // Hashed password
    }
];

let carts = []; // Array to store cart items per user
let orders = []; // Array to store orders

// Middleware: Authenticate User
function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: 'No token provided.' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ success: false, message: 'Failed to authenticate token.' });

        const user = users.find(u => u.id === decoded.id);
        if (!user) return res.status(403).json({ success: false, message: 'User not found.' });

        req.user = user;
        next();
    });
}

// Get all products
app.get('/api/products', (req, res) => {
    res.json({ success: true, products });
});

// Get product by ID
app.get('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = products.find(p => p.id === productId);
    if (product) {
        res.json({ success: true, product });
    } else {
        res.status(404).json({ success: false, message: 'Product not found.' });
    }
});

// User registration
app.post('/api/register', async (req, res) => {
    const { fullName, email, address, city, state, zip, password } = req.body;
    if (!fullName || !email || !address || !city || !state || !zip || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
        id: users.length + 1,
        fullName,
        email,
        address,
        city,
        state,
        zip,
        password: hashedPassword
    };

    users.push(newUser);
    res.json({ success: true, message: 'Registration successful.' });
});

// User login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Create JWT token
    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ success: true, token });
});

// Get user profile
app.get('/api/profile', authenticate, (req, res) => {
    const { fullName, email, address, city, state, zip } = req.user;
    res.json({
        success: true,
        user: { fullName, email, address, city, state, zip }
    });
});

// Handle contact form submissions
app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Here, you would typically save the message to a database or send an email.
    console.log(`New contact message from ${name} (${email}): ${subject} - ${message}`);

    res.json({ success: true, message: 'Message sent successfully.' });
});

// Subscribe to newsletter
app.post('/api/subscribe', (req, res) => {
    const { email } = req.body;
    if (!email || !validateEmail(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }

    // Here, you would typically save the email to a database or mailing list.
    console.log(`New newsletter subscription: ${email}`);

    res.json({ success: true, message: 'Subscribed successfully.' });
});

// Add item to cart
app.post('/api/cart', authenticate, (req, res) => {
    const { productId, quantity, size } = req.body;

    if (!productId || !quantity || !size) {
        return res.status(400).json({ success: false, message: 'Invalid data.' });
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check if item already in cart
    const existingItem = carts.find(item => item.productId === productId && item.size === size && item.userId === req.user.id);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        carts.push({
            id: carts.length + 1,
            userId: req.user.id,
            productId,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity,
            size
        });
    }

    res.json({ success: true, message: 'Product added to cart.' });
});

// Get cart items
app.get('/api/cart', authenticate, (req, res) => {
    const userCart = carts.filter(item => item.userId === req.user.id);
    res.json({ success: true, cart: userCart });
});

// Remove item from cart
app.delete('/api/cart/:id', authenticate, (req, res) => {
    const itemId = parseInt(req.params.id);
    const index = carts.findIndex(item => item.id === itemId && item.userId === req.user.id);

    if (index !== -1) {
        carts.splice(index, 1);
        res.json({ success: true, message: 'Item removed from cart.' });
    } else {
        res.status(404).json({ success: false, message: 'Item not found in cart.' });
    }
});

// Update cart item quantity
app.put('/api/cart/:id', authenticate, (req, res) => {
    const itemId = parseInt(req.params.id);
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
        return res.status(400).json({ success: false, message: 'Invalid quantity.' });
    }

    const item = carts.find(item => item.id === itemId && item.userId === req.user.id);

    if (item) {
        item.quantity = quantity;
        res.json({ success: true, message: 'Cart updated successfully.' });
    } else {
        res.status(404).json({ success: false, message: 'Item not found in cart.' });
    }
});

// Checkout Endpoint
app.post('/api/checkout', authenticate, (req, res) => {
    const { fullName, address, city, state, zip, payment } = req.body;

    if (!fullName || !address || !city || !state || !zip || !payment) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const { cardNumber, expiry, cvv } = payment;

    if (!cardNumber || !expiry || !cvv) {
        return res.status(400).json({ success: false, message: 'All payment fields are required.' });
    }

    // Here, you would typically process the payment securely.

    // Create order
    const userCart = carts.filter(item => item.userId === req.user.id);
    if (userCart.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    const total = userCart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const newOrder = {
        id: orders.length + 1,
        userId: req.user.id,
        date: new Date().toLocaleDateString(),
        total: total,
        status: 'Processing',
        items: userCart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
            size: item.size
        }))
    };

    orders.push(newOrder);

    // Clear user's cart
    carts = carts.filter(item => item.userId !== req.user.id);

    res.json({ success: true, message: 'Order placed successfully.', orderId: newOrder.id });
});

// Helper Function to Validate Email
function validateEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});
