<<<<<<< HEAD
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
=======
'use strict';
// Dependencies
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
const methodOverride = require('method-override');
const app = express();

// Setup environment
const PORT = process.env.PORT || 3030;
const DATABASE_URL = process.env.DATABASE_URL;

// Setup database
const client =  new pg.Client({
  connectionString: DATABASE_URL,
});

// Middleware
app.use(cors());
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());




//


// function renderSearchResults (req , res) {
//   const query = {
//      apikey : process.env.EVENT_KEY ,
//     // locale: '*' ,
//     keyword : req.body.searched,
//     sort: req.body.sortBy ,
//     countryCode :  req.body.countryCode
//   }
//   console.log('query.keyword' ,query.keyword);
//   const url =  'https://app.ticketmaster.com/discovery/v2/events?apikey=HybkkamcQAG2qkxKtCkNknuFZvrNBLlx&locale=*';

//   superagent.get(url).query(query).then((data) => {
//     const eventData = data.body._embedded.events;
//     const event = eventData.map(event => {
//       return new Event(event);
//     })


//     res.render('pages/event/search' , { events: event });

//   }).catch((err) => errorHandler(err, req, res));

// }

const renderSearchResults = (req, res) => {
  const query = {
    apikey : process.env.EVENT_KEY ,
    keyword : req.body.searched,
    sort: req.body.sortBy ,
    countryCode :  req.body.countryCode
  }
  const url =  'https://app.ticketmaster.com/discovery/v2/events?&locale=*';

  superagent.get(url).query(query).then((data) => {
    const eventData = data.body._embedded.events;
    // eventData = [eventData];
    const event = eventData.map(event => {
      return new Event(event);
    });
    console.log('🚀 event', event);
    res.render('pages/event/search', { events: event });
  }).catch((err) => errorHandler(err, req, res));
};




const renderSearchPage = (req, res) => {
  const url = 'https://app.ticketmaster.com/discovery/v2/events?apikey=HybkkamcQAG2qkxKtCkNknuFZvrNBLlx&locale=*&sort=random';

  superagent.get(url).then((data) => {
    let eventData = data.body._embedded.events;
    // eventData = [eventData];
    const event = eventData.map(event => {
      return new Event(event);
    });
    console.log('🚀 event', event);
    res.render('pages/event/index', { events: event });
  }).catch((err) => errorHandler(err, req, res));
};




// Error Handler
function errorHandler(err, req, res) {
  res.render('pages/error', { err :err.message});
}

// wrong path rout
const handelWrongPath = (err, req, res) => {
  errorHandler(err, req ,res);
};

// database connection
client.connect().then(() => {
  app.listen(PORT, () => {
    console.log('connected to db', client.connectionParameters.database);
    console.log(`The server is running on port ${PORT}`);
  });
}).catch(error => {
  console.log('error', error);
});

// Event Constructor
function Event (data) {

  this.eventId = data.id ;
  this.country = data._embedded.venues[0].country.name;
  this.countryCode = data._embedded.venues[0].country.countryCode ;
  this.eventName = data.name;
  this.city = data._embedded.venues[0].city.name;
  this.venues = data._embedded.venues[0].name;
  this.imageUrl =data.images[0].url;
  this.end_date = data.sales.public.endDateTime;
  this.startDate = data.sales.public.startDateTime;
  this.Description = data.info;
  this.url = data.url;
}

// API home page Routes
app.get('/', renderSearchPage);
// Search Results
app.post('/searches', renderSearchResults);
// wrong path rout
app.use('*',handelWrongPath);

>>>>>>> b2517155a26b831f81460c5e174a376f290264d0
