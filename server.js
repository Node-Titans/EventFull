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

// Middleware
app.use(cors());
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//  app.use(express.static('./public/styles'));
app.use(express.static('./public/js'));
// database Setup
const client =  new pg.Client({
  connectionString: DATABASE_URL,
});


const renderSearchPage = (req, res) => {
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
    // console.log('🚀 event', event);
    res.render('pages/event/search', { events: event });
  }).catch((err) => errorHandler(err, req, res));
};




const renderMainPage = (req, res) => {
  // the country should be added to find the venous
  const url = 'https://app.ticketmaster.com/discovery/v2/events?apikey=HybkkamcQAG2qkxKtCkNknuFZvrNBLlx&locale=*&sort=random&countryCode=US';

  superagent.get(url).then((data) => {
    let eventData = data.body._embedded.events;
    // console.log("🚀 ~ file: server.js ~ line 59 ~ superagent.get ~ eventData", eventData)
    // eventData = [eventData];
    const event = eventData.map(event => {
      return new Event(event);
    });
    console.log('🚀 event', event);
    res.render('pages/event/index', { events: event });
  }).catch((err) => errorHandler(err, req, res));
};




// Error Handler
// function errorHandler(err, req, res) {
//   res.render('pages/error', { err :err.message});
// }

// wrong path rout
const handelWrongPath = (err, req, res) => {
  errorHandler(err, req ,res);
};

// ERROR HANDLER
const errorHandler = (err, req, res) => {
  console.log('err', err);
  res.status(500).render('pages/error', { err: err });
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
class Event {
  constructor(data) {

    this.eventId = data.id;
    this.country = data._embedded.venues[0].country.name;
    this.countryCode = data._embedded.venues[0].country.countryCode;
    this.eventName = data.name;
    this.city = data._embedded.venues[0].city.name;
    this.venues = data._embedded.venues[0].name;
    this.imageUrl = data.images[0].url;
    this.end_date = data.sales.public.endDateTime;
    this.startDate = data.sales.public.startDateTime;
    this.Description = data.info;
    this.url = data.url;
  }
}

// API home page Routes
app.get('/', renderMainPage);
// Search Results
app.post('/searches', renderSearchPage);
// wrong path rout
app.use('*',handelWrongPath);

