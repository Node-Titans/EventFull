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
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const passport = require('passport');


// Setup environment
const PORT = process.env.PORT || 3030;
const DATABASE_URL = process.env.DATABASE_URL;

// Middleware
app.use(cors());
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
const urlencodedParser = bodyParser.urlencoded({ extended: false })
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
    cb(null, file.originalname)
    }
 
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

  }).catch((err) => {
    res.render('pages/event/search', { events: 0 });
  });
}

function addEventHomePage(req,res){
  const eventId=req.body.eventId;
  const eventName=req.body.eventName;
  const img=req.body.img;
  const venues=req.body.venues;
  const country=req.body.country;
  const countryCode=req.body.countryCode;
  const city=req.body.city;
  const enddate=req.body.enddate;
  const startdate=req.body.startdate;
  const Description=req.body.Description;
  const url=req.body.url;
  const safeValues=[eventId,eventName,country,countryCode,city,venues,img,enddate,startdate,Description,url];
  const sqlQuery='INSERT INTO events (event_id,event_name,country,countryCode,city,venues,image_url,end_date,start_date,description,url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (event_id) DO NOTHING;'
  client.query(sqlQuery,safeValues).then(()=>{
    res.redirect('/');
  }).catch((err) => errorHandler(err, req, res));
}

function addEventSearch(req,res){
  const eventId=req.body.eventId;
  const eventName=req.body.eventName;
  const img=req.body.img;
  const venues=req.body.venues;
  const country=req.body.country;
  const countryCode=req.body.countryCode;
  const city=req.body.city;
  const enddate=req.body.enddate;
  const startdate=req.body.startdate;
  const Description=req.body.Description;
  const url=req.body.url;
  const idq='SELECT loginid FROM uidlogin ORDER BY ID DESC LIMIT 1;';
  client.query(idq).then((data)=>{
    const iduser=data.rows[0].loginid;
    const safeValues=[eventId,eventName,country,countryCode,city,venues,img,enddate,startdate,Description,url];
    const safevalues2=[iduser,eventId];
    const sqlQuery='INSERT INTO events (event_id,event_name,country,countryCode,city,venues,image_url,end_date,start_date,description,url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (event_id) DO NOTHING RETURNING event_id;';
    client.query(sqlQuery,safeValues).then(()=>{
      const idinsert=`INSERT INTO users_events (user_id,event_id) VALUES ($1 , $2) ON CONFLICT (user_id,event_id) DO NOTHING;`;
      client.query(idinsert,safevalues2).then(()=>{
        res.redirect('/');
      });
    });
  }).catch((err) => errorHandler(err, req, res));
}

const renderMainPage = (req, res) => {
  // the country should be added to find the venous
  const url = 'https://app.ticketmaster.com/discovery/v2/events?apikey=HybkkamcQAG2qkxKtCkNknuFZvrNBLlx&locale=*&sort=random&countryCode=US&page=2';

  superagent.get(url).then((data) => {

    let eventData = data.body._embedded.events;
    const event = eventData.map(event => {
      return new Event(event);
    });
    res.render('pages/event/index', { events: event });
  }).catch((err) => errorHandler(err, req, res));
};

function renderYourList(req,res){
  // const userlogin='SELECT * FROM uidlogin ORDER BY ID DESC LIMIT 1;';
  const idq='SELECT loginid FROM uidlogin ORDER BY ID DESC LIMIT 1;';
  client.query(idq).then((data)=>{
    const iduser=data.rows[0].loginid;
    const sql=`select * from users join users_events on (users.id=users_events.user_id) join events on (events.event_id=users_events.event_id) where users.id=${iduser};`;
    client.query(sql).then((results)=>{
      res.render('pages/user/userList',{searchResults:results.rows})
    });
  }).catch((err) => errorHandler(err, req, res));
}
function renderEventDetails(req,res){
  const eventid=req.params.id;
  const sqlQuery='SELECT * FROM events WHERE id=$1';
  const saveValues=[eventid];
  client.query(sqlQuery,saveValues).then((results)=>{
    res.render('pages/user/details',{results:results.rows});
  }).catch((err) => errorHandler(err, req, res));
}

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
class Event {
  constructor(data) {

    this.eventId = data.id;
    this.country = data._embedded.venues[0].country.name;
    this.countryCode = data._embedded.venues[0].country.countryCode;
    this.eventName = data.name;
    this.city = data._embedded.venues[0].city.name;
    this.venues = data._embedded.venues[0].name;
    this.imageUrl = data.images[0].url;
    this.end_date = data.sales.public.endDateTime ? data.sales.public.endDateTime : '2021-04-25';
    this.startDate = data.sales.public.startDateTime ? data.sales.public.startDateTime : '2021-04-25';
    this.Description = data.info ? data.info : 'no description available';
    this.url = data.url;
  }

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
      res.render('pages/user-signin-up/sign-up', {
        msg: error,
      });
    } else {

      if (req.file === undefined) {
        res.render('pages/user-signin-up/sign-up', {
          msg: 'Error : No file selected !!',
        });
      } else {
        const image = `uploads/${req.file.originalname}`;
        const sqlQuery = 'INSERT INTO images (image) VALUES($1) RETURNING id;';
        const safeValues = [image];
        client.query(sqlQuery, safeValues).then(() => {
          res.render('pages/user-signin-up/sign-up', {
            msg: 'file Uploaded ✔️',
          });
        })
      }

    }
  });
}

async function registerNewUser(req, res){
  try {
    const { username, age , email, password, country , phoneNumber } = req.body;
    const user = 'SELECT * FROM users WHERE username=$1;';
    const safeValue = [username]
    //check if username already exists
    client.query(user, safeValue).then(async(results) => {
      if (results.rows.length !== 0) {
        res.render('pages/user-signin-up/sign-up',{
          error: 'Sorry! An account with that username already exists!❌',
        });
      }
      else {
      //encrypt the password before saving it in the database
        bcrypt.hash(password, 10, async (error, hashedPassword) => {
          if (error) {
            res.send({
              error: error.message,
            });
          } else {
            const userimage='SELECT image FROM images ORDER BY ID DESC LIMIT 1';
            client.query(userimage).then((data=>{
            const image=data.rows[0].image;
            const newUser = `INSERT INTO users (username, age ,image, email, password, country , phoneNumber) VALUES($1, $2, $3, $4, $5,$6,$7) RETURNING *`;
            const safeValues= [username, age ,image, email,hashedPassword, country , phoneNumber];
            client.query(newUser, safeValues).then((results) => {
             res.render('pages/user-signin-up/sign-up',{
              massage :'Account created successfully!✔️' ,  
              });
            
            }); }
              ));
          }
        })
      }
    })
    const usermail = 'SELECT * FROM users WHERE email=$1;';
    const safeValuemail = [email]
    //check if email already exists
    client.query(usermail, safeValuemail).then(async(results) => {
      if (results.rows.length !== 0) {
        res.render('pages/user-signin-up/sign-up',{
          error4: 'Sorry! An account with that email already exists!❌',
        });

      }
    })
  }
  catch (error) {
    res.send({
      error: error.message,
    });
  }}


async function handleLogin(req, res){
  try {
    const {username, password } = req.body;
    const user ='SELECT * FROM users WHERE username=$1';
    const safeValue=[username];
    client.query(user, safeValue).then(async(results) => {
      if (results.rows.length === 0) {
        res.render('pages/user-signin-up/sign-in',{
          error: 'Sorry! An account with that username doesn\'t exist!❌',
        });
      } else {
        //check if the password entered matches the one in the database
        bcrypt.compare(password, results.rows[0].password, (err, validPassword) => {
          if (err) {
            res.render('pages/user-signin-up/sign-in',{
              error2: 'Sorry! your username or password is incorrect❌ ',
            });
          } else if (validPassword) {
            // console.log('userid',results.rows[0].id);
            const idquery=`INSERT INTO uidlogin (loginid) VALUES (${results.rows[0].id})`;
            client.query(idquery);
            res.redirect('/');

          } else {
            res.render('pages/user-signin-up/sign-in',{
              error3: 'Sorry! your username or password is incorrect❌ ',
            });
          }
        });
      }
    })
  } catch (err) {
    res.send({
      error: err.message,
    });
  }}



function handleLogout( req, res) {
  delete req.session;
  res.render('pages/user-signin-up/sign-in');// will always fire after session is destroyed


}



function deleteEvent(req,res) {
  const eventId = req.params.id ;
  const idq='SELECT loginid FROM uidlogin ORDER BY ID DESC LIMIT 1;';


  client.query(idq).then((data)=>{

    const iduser=data.rows[0].loginid ;
    

    const deleteQuery=` delete from users_events where event_id=$1 AND user_id=$2;`;
    const into = [eventId , iduser];
    client.query(deleteQuery, into).then(() =>{
      res.redirect('/user');
    });
  })

}

app.get("/profile", function (req, res) {
  const idq='SELECT loginid FROM uidlogin ORDER BY ID DESC LIMIT 1;';
  const userinf= 'SELECT * FROM users WHERE id=$1;';
  client.query(idq).then((data)=>{
    const iduser=data.rows[0].loginid ;
    const into = [iduser];
  client.query(userinf,into).then(results => {
       console.log('😎😎😎😎😎😎😎😎😎😎😎😎😎😎😎😎😎😎',results.rows[0]);
     res.render('pages/user-signin-up/user-profile', { results: results.rows[0] });
  });
}).catch(error => { 
  res.send({
  error: err.message,
});
});
}); 

// API home page Routes


app.post('/homepage',addEventHomePage);
app.post('/searchespage',addEventSearch)
app.get('/user',renderYourList);
app.get('/user/:id',renderEventDetails);
app.get('/', renderMainPage);
// Search Results
app.post('/searches', renderSearchPage);
app.post('/check',urlencodedParser,registerNewUser);
app.get('/logout',handleLogout);
app.post('/login',urlencodedParser,handleLogin);


// handle upload profile image
app.post('/upload', handleProfilePic);
app.get('/sign-up', (req, res) => {
  // sign up page
  res.render('pages/user-signin-up/sign-up')
});
app.get('/about', (req, res) => {
  res.render('pages/aboutUs/aboutUs')
});
// sign in page
app.get('/sign-in',(req,res)=>{
  res.render('pages/user-signin-up/sign-in');
});
// Delete Book in The Database
app.delete('/event/:id', deleteEvent);
// wrong path rout
app.use('*', handelWrongPath);






