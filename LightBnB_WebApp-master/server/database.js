const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'james',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});



/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {

  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((result) => result.rows[0])
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getUserWithEmail = getUserWithEmail;


/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  // return Promise.resolve(users[id]);

  return pool
  .query(`SELECT id FROM users WHERE id = $1`, [id])
  .then((result) => result.rows[0])
  .catch((err) => {
    console.log(err.message);
  });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {

  return pool
  .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;` , [user.name, user.email, user.password] )
  .then((result) => result.rows[0])
  .catch((err) => {
    console.log(err.message);
  });
}
exports.addUser = addUser;


/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
  .query(`SELECT * FROM reservations
    JOIN users ON users.id = guest_id
    JOIN properties ON properties.id = property_id 
    WHERE guest_id = $1 `, [guest_id])
  .then((result) => result.rows)
  .catch((err) => {
    console.log(err.message);
  });


}
exports.getAllReservations = getAllReservations;


/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = function (options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3

  if (options.owner_id) {
    const clause = queryParams.length > 0 ? 'AND' : 'WHERE';
    queryParams.push(options.owner_id);
    queryString += `${clause} owner_id = $${queryParams.length} `;
  }
  
  if (options.city) {
    const clause = queryParams.length > 0 ? 'AND' : 'WHERE';
    queryParams.push(`%${options.city}%`);
    queryString += `${clause} city LIKE $${queryParams.length} `;
  }

  if (options.minimum_price_per_night) {
    const clause = queryParams.length > 0 ? 'AND' : 'WHERE';
    queryParams.push(options.minimum_price_per_night * 100);
    queryString += `${clause} cost_per_night >= $${queryParams.length} `;
  }

  if (options.maximum_price_per_night) {
    const clause = queryParams.length > 0 ? 'AND' : 'WHERE';
    queryParams.push(options.maximum_price_per_night * 100);
    queryString += `${clause} cost_per_night <= $${queryParams.length} `;
  }

  if (options.minimum_rating) {
    const clause = queryParams.length > 0 ? 'AND' : 'WHERE';
    queryParams.push(`${options.minimum_rating}`);
    queryString += `${clause} property_reviews.rating >= $${queryParams.length} `;
  }


  // 4
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5
  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams).then((res) => res.rows);
};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */

 const addProperty = function(property) {
  const queryString = `
  INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *;
  `;
  const queryArr = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms
  ];

  return pool
  .query(queryString, queryArr)
  .then((response) => {response.rows[0]})
  .catch((error) => error);
}
exports.addProperty = addProperty;
