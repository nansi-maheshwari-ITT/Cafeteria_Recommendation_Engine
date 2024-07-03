import mysql from 'mysql2/promise';

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Myself@1203',
  database: 'food_recommendation_engine'
});

export default connection;
