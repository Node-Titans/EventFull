DROP TABLE IF EXISTS events;
create table events (
    id SERIAL not null,
    event_id VARCHAR(255) primary key not null,
    event_name VARCHAR(255),
    country VARCHAR(255),
    countryCode VARCHAR(40),
    city VARCHAR(255),
    venues VARCHAR(255),
    image_url VARCHAR(255),
    end_date DATE NOT NULL,
    start_date DATE NOT NULL,
    Description TEXT ,
    url VARCHAR(400)
);

 DROP TABLE IF EXISTS users;
 CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY NOT NULL,
  username VARCHAR(20) UNIQUE NOT NULL,
  age INT , CHECK (age>16),
  email VARCHAR(50) UNIQUE NOT NULL,
  password CHAR(60),
  country  VARCHAR(255),
  phoneNumber VARCHAR(255)
  );


 DROP TABLE IF EXISTS images;
  CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY NOT NULL,
  image VARCHAR(500)
  );

  
DROP TABLE IF EXISTS users_events ;
CREATE TABLE  users_events (
  user_id  int REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE ,
 event_id VARCHAR(255) REFERENCES events (event_id) ON UPDATE CASCADE ON DELETE CASCADE ,
  CONSTRAINT user_event_pkey PRIMARY KEY (user_id, event_id)
);

DROP TABLE IF EXISTS uidlogin ;
CREATE TABLE uidlogin (
  id SERIAL PRIMARY KEY NOT NULL,
  loginid INT
);
