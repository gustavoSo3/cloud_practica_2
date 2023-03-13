const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();


const AWS = require('aws-sdk')
const DynamoDBStore = require('connect-dynamodb')(session)

var port = normalizePort(process.env.PORT || '3000');

const app = express();
app.set('view engine', 'ejs');

AWS.config.update({
  region: 'us-east-1',
})
const dynamodb = new AWS.DynamoDB()

app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'my-secret-key',
  resave: false,
  saveUninitialized: true,
  store: new DynamoDBStore({
    client: dynamodb,
    table: 'session'
  })
}));

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL, image TEXT)');
  db.run("INSERT INTO products (name, price, image) VALUES ('Product 1', 10.0, 'https://hellobucketpractica2.s3.amazonaws.com/cave_connection.png')");
  db.run("INSERT INTO products (name, price, image) VALUES ('Product 2', 20.0, 'https://hellobucketpractica2.s3.amazonaws.com/Fnfo2L8aIAAOBVA.png')");
  db.run("INSERT INTO products (name, price, image) VALUES ('Product 3', 30.0, 'https://hellobucketpractica2.s3.amazonaws.com/free-zoom-backgrounds.jpg')");
});


app.get('/', (req, res) => {
  db.all('SELECT * FROM products', (err, products) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    } else {
      res.render('index', { products, cart: req.session.cart || [] });
    }
  });
});

app.post('/add-to-cart', (req, res) => {
  console.log(req.body)
  const productId = req.body.productId;
  db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    } else if (!product) {
      res.sendStatus(404);
    } else {
      if (!req.session.cart) {
        req.session.cart = [];
      }
      req.session.cart.push(product);
      res.redirect('/');
    }
  });
});


function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});