// Navbar Toggle for Mobile
const bar = document.getElementById('bar');
const closeBtn = document.getElementById('close');
const nav = document.getElementById('navbar');

if (bar) {
    bar.addEventListener('click', () => {
        nav.classList.add('active');
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        nav.classList.remove('active');
    });
}

// Subscribe to Newsletter Function
function subscribeNewsletter(emailInputId) {
    const emailInput = document.getElementById(emailInputId);
    if (!emailInput) return;

    const email = emailInput.value.trim();

    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    // Send email to backend
    fetch('http://localhost:5000/api/subscribe', { // Update with your backend URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Subscribed successfully!');
                emailInput.value = '';
            } else {
                alert('Subscription failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during subscription.');
        });
}

// Email Validation Function
function validateEmail(email) {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}

// Add to Cart Function
function addToCart(productId, size, quantity) {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login to add items to the cart.');
        window.location.href = 'login.html';
        return;
    }

    // Send add to cart request
    fetch('http://localhost:5000/api/cart', { // Update with your backend URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity, size })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Product added to cart successfully!');
                updateCartCount();
            } else {
                alert('Failed to add to cart: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while adding to cart.');
        });
}

// Update Cart Count in Header
function updateCartCount() {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:5000/api/cart', { // Update with your backend URL
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const count = data.cart.reduce((acc, item) => acc + item.quantity, 0);
                const cartIcon = document.querySelector('#lg-bag a');
                if (cartIcon) {
                    cartIcon.innerHTML = `<i class="far fa-shopping-bag"></i> (${count})`;
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Update Navbar Based on Authentication
function updateNavbar() {
    const token = localStorage.getItem('token');
    const userMenu = document.getElementById('user-menu');
    const logoutBtn = document.getElementById('logout-btn');

    if (token) {
        userMenu.innerHTML = '<a href="my-account.html">My Account</a>';
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
            logoutBtn.addEventListener('click', function (e) {
                e.preventDefault();
                logout();
            });
        }
    } else {
        userMenu.innerHTML = '<a href="login.html">Login</a>';
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
    }
}

// Logout Function
function logout() {
    localStorage.removeItem('token');
    updateNavbar();
    window.location.href = 'login.html';
}

// Initialize Cart Count and Navbar on Page Load
document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    updateCartCount();

    // Attach event listeners to all add-to-cart buttons on the page
    const addCartButtons = document.querySelectorAll('.add-to-cart');
    addCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const productId = button.getAttribute('data-id');

            // Depending on the page, size and quantity might be required
            let size = null;
            let quantity = 1;

            // Check if size selection exists
            const sizeSelect = button.closest('.single-pro-details')?.querySelector('#size-select');
            if (sizeSelect) {
                size = sizeSelect.value;
                if (size === 'Select Size') {
                    alert('Please select a size.');
                    return;
                }
            }

            // Check if quantity input exists
            const quantityInput = button.closest('.single-pro-details')?.querySelector('#quantity');
            if (quantityInput) {
                quantity = parseInt(quantityInput.value);
                if (isNaN(quantity) || quantity < 1) {
                    alert('Quantity must be at least 1.');
                    return;
                }
            }

            addToCart(productId, size, quantity);
        });
    });
});
