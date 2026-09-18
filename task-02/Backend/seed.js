require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://chamashastuwart_db_user:3suTAhSpe1tDga2R@cluster0.y0cwmjk.mongodb.net/test";

const seedProducts = [
  {
    title: "iPhone 15 Pro Max",
    description: "The ultimate iPhone featuring aerospace-grade titanium design, A17 Pro chip, and a more advanced 48MP Main camera.",
    price: 1199.99,
    category: "Electronics",
    stockQuantity: 45,
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "MacBook Pro 16-inch (M3 Max)",
    description: "Mind-blowing performance with the M3 Max chip. Up to 22 hours of battery life and a stunning Liquid Retina XDR display.",
    price: 3499.00,
    category: "Electronics",
    stockQuantity: 20,
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Sony WH-1000XM5 Wireless Headphones",
    description: "Industry-leading noise cancellation, exceptional sound quality, and all-day comfort with up to 30 hours of battery life.",
    price: 398.00,
    category: "Electronics",
    stockQuantity: 150,
    imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Premium Wool Blend Overcoat",
    description: "A timeless winter staple. Tailored from a luxurious wool blend to keep you warm without compromising on style.",
    price: 245.50,
    category: "Clothing",
    stockQuantity: 60,
    imageUrl: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Classic White Cotton T-Shirt",
    description: "Essential everyday wear. Made from 100% organic heavy-weight cotton for a perfect drape and maximum durability.",
    price: 35.00,
    category: "Clothing",
    stockQuantity: 300,
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Modern Minimalist Sofa",
    description: "Elevate your living space. Features clean lines, premium fabric upholstery, and high-density foam cushions.",
    price: 1299.00,
    category: "Home",
    stockQuantity: 12,
    imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Ceramic Artisan Coffee Mug Set",
    description: "Handcrafted by expert artisans. Each mug in this set of 4 features a unique glaze pattern.",
    price: 58.00,
    category: "Home",
    stockQuantity: 85,
    imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "The Design of Everyday Things",
    description: "By Don Norman. A primer on how-and why-some products satisfy customers while others only frustrate them.",
    price: 18.99,
    category: "Books",
    stockQuantity: 110,
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  },
  {
    title: "Atomic Habits",
    description: "By James Clear. An easy and proven way to build good habits and break bad ones.",
    price: 21.00,
    category: "Books",
    stockQuantity: 200,
    imageUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
  }
];

const seedDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    console.log('Clearing existing products...');
    await Product.deleteMany({});
    
    console.log('Inserting new seed data with high-quality images...');
    await Product.insertMany(seedProducts);
    
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
