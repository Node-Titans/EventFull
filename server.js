"use strict";
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');

const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3004;
const methodOverride = require('method-override');

const pg = require('pg');
//const dbClient = new pg.Client(process.env.DATABASE_URL)
//dbClient.connect();
app.use(methodOverride('_methode'))
app.use(express.static('./public/styles'));
app.use(express.static('./public/js'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.set('view engine', 'ejs');
app.set("views", ".")
app.get('/', (req, res) => {

    res.render('pages/event/index');
});

app.get('*', (req, res) => {
    res.send('Not found')
});

const errorHandler = (err, req, res) => {
    console.log('err', err);
    res.status(500).render('pages/error', { err: err });
};

app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
});