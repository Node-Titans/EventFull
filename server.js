'use strict';
// Dependencies
require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');
const methodOverride = require('method-override');
const app = express();
const path = require('path');
const multer = require('multer'); // to upload image


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
const client = new pg.Client({
    connectionString: DATABASE_URL,
});

// set storage engine
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});

const renderSearchResults = (req, res) => {
    const query = {
        apikey: process.env.EVENT_KEY,
        keyword: req.body.searched,
        sort: req.body.sortBy,
        countryCode: req.body.countryCode
    }
    const url = 'https://app.ticketmaster.com/discovery/v2/events?&locale=*';

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




const renderSearchPage = (req, res) => {
    const url = 'https://app.ticketmaster.com/discovery/v2/events?apikey=HybkkamcQAG2qkxKtCkNknuFZvrNBLlx&locale=*&sort=random';

    superagent.get(url).then((data) => {
        let eventData = data.body._embedded.events;
        // eventData = [eventData];
        const event = eventData.map(event => {
            return new Event(event);
        });
        // console.log('🚀 event', event);
        res.render('pages/event/index', { events: event });
    }).catch((err) => errorHandler(err, req, res));
};




// Error Handler
// function errorHandler(err, req, res) {
//   res.render('pages/error', { err :err.message});
// }

// wrong path rout
const handelWrongPath = (err, req, res) => {
    errorHandler(err, req, res);
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
function Event(data) {

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


//init upload 
const upload = multer({
    storage: storage,
    limits: { fieldSize: 1000000 },
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }

}).single('image');


function checkFileType(file, cb) {
    //allowed extentions
    const filetypes = /jpeg|jpg|png|gif/;
    //check extentions
    const extentionName = filetypes.test(path.extname(file.originalname).toLowerCase());
    //check the  mimetype for image
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extentionName) {
        return cb(null, true);
    } else {
        return cb('Images only !!')
    }
}

function handleProfilePic(req, res) {
    upload(req, res, (error) => {
        if (error) {
            res.render('user-signin-up/sign-up', {
                msg: error,
            });
        } else {

            if (req.file == undefined) {
                res.render('user-signin-up/sign-up', {
                    msg: 'Error : No file selected !!',
                });
            } else {
                const image = `uploads/${req.file.fieldname}-${Date.now()}${path.extname(req.file.originalname)}`;
                const sqlQuery = 'INSERT INTO images (image) VALUES($1) RETURNING id;';
                const safeValues = [image];
                client.query(sqlQuery, safeValues).then(() => {
                    res.render('user-signin-up/sign-up', {
                        msg: 'file Uploaded ✔️',
                    });
                })
            }

        }
    });
}


// API home page Routes
app.get('/', renderSearchPage);
// Search Results
app.post('/searches', renderSearchResults);
// wrong path rout
app.use('*', handelWrongPath);
// handle upload profile image
app.post('/upload', handleProfilePic);

app.get('/sign-up', (req, res) => {
    res.render('user-signin-up/sign-up')
  });

app.get('/sign-in',((req,res)=>{
  res.render("user-signin-up/sign-in");
  }))
  

