const express = require('express');
const app = express()
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const port= process.env.PORT || 6001

// middleware

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionSuccessStatus: 200,
}

app.use(express.json())
app.use(cors(corsOptions))

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uoysey8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const productCollection= client.db('smartShopper').collection('products')

    // app.get('/products', async(req,res)=>{
    //     const result= await productCollection.find().toArray()
    //     res.send(result)
    // })

    // Pagination endpoint
    app.get('/products', async (req, res) => {
      const page = parseInt(req.query.page) || 1; // Default to page 1
      const limit = parseInt(req.query.limit) || 10; // Default limit is 10
      const skip = (page - 1) * limit; // Calculate how many products to skip

      const searchQuery = req.query.name || ''; // Get the search query from the request
      // const brand = req.query.brand || ''; 
    const category = req.query.category || ''; 
    const minPrice = parseFloat(req.query.minPrice) || 0; 
    const maxPrice = parseFloat(req.query.maxPrice) || Infinity;
    const sortBy = req.query.sortBy || '';
      // Build the search filter
      const searchFilter = {
        name: { $regex: searchQuery, $options: 'i' },  // Name filter (case-insensitive)
        price: { $gte: minPrice, $lte: maxPrice },  // Price range filter
    };

    // if (brand) searchFilter.brand = brand;  // Filter by brand
    if (category) searchFilter.category = category;  // Filter by category
      
    // Sorting logic
    let sortOption = {};
    if (sortBy === 'priceAsc') sortOption.price = 1; // Price Low to High
    else if (sortBy === 'priceDesc') sortOption.price = -1; // Price High to Low
    else if (sortBy === 'dateDesc') sortOption.creationDate = -1; // Newest First

      const totalProducts = await productCollection.countDocuments(searchFilter); // Total number of products
      const totalPages = Math.ceil(totalProducts / limit); // Total pages available

      const result = await productCollection.find(searchFilter).sort(sortOption).skip(skip).limit(limit).toArray(); // Fetch products with skip and limit
      res.send({
        products: result,
        currentPage: page,
        totalPages: totalPages,
        totalProducts: totalProducts,
      });
    });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello World!')
  })
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })