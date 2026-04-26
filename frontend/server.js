const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const axios = require('axios');
const ejs = require('ejs');
require('dotenv').config()
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));

app.get('/', (req, res) => {
  res.render('index.ejs', { error: null, name: "", email: "" });
});
app.post('/create-user', async (req, res) => {
  try {
    if (!req.body.name || !req.body.email) {
      res.render('index', { error: "All fields are required", name: req.body?.name, email: req.body?.email });
    } else {
      try {
        const backendUrl = `${process.env.BACKEND_URL}/submit`;
        const response = await axios.post(backendUrl, req.body)
        console.log(response);
        if (response.status === 200) {
          res.status(200).send(req.body.name + " " + req.body.email + " Successfully submitted data");
        } else {
          res.status(500).send(error.response.data.error);
        }
      } catch (error) {
        res.status(500).send(error.response?.statusText);
      }
    }
  }
  catch (error) {
    console.log(error.response)
    res.status(500).send(error.response?.statusText);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
