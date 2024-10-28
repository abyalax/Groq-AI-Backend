import express, { json, urlencoded } from "express";
import cors from "cors";
import { responseAPI, responseData } from "./utils/response.js"
import { hashSync, compareSync } from "bcrypt";
import pool from "./db/postgres-config.js";

const app = express();
const saltRounds = 10;

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

pool.connect((err) => {
  if (err) {
    console.log("Failed to connect to database:", err);
  } else {
    console.log("Connected to PostgreSQL Database");
  }
});

// Get Users
app.get("/api/v1/users", (req, res) => {
  pool.query("SELECT * FROM users", (err, result) => {
    if (err) {
      console.error("Error fetching users:", err);
      return responseAPI(res, false, 500, "Failed to get users");
    }
    responseData(res, result.rows); 
  });
});

//Register
app.post("/api/v1/users", (req, res) => {
  const hash = hashSync(req.body.password, saltRounds);
  const { nama, email, password } = req.body;
  const sql = "INSERT INTO users (nama, email, password) VALUES ($1, $2, $3) RETURNING *";
  const values = [nama, email, hash];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting user:", err);
      return responseAPI(res, false, 500, "Failed to get users");
    }
    responseData(res, result.rows[0]);
  });
});

//Login
app.post("/api/v1/users/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM users WHERE email = $1";

  pool.query(sql, [email], (err, result) => {
    if (err) {
      console.error("Error fetching user:", err);
      return responseAPI(res, false, 500, "Failed to get users");
    }

    const users = result.rows;
    if (users.length > 0) {
      const user = users[0];
      const isMatch = compareSync(password, user.password);
      if (isMatch) {
        return responseData(res, user)
      } else {
        responseAPI(res, false, 401, "Invalid email or password");
      }
    } else {
      responseAPI(res, false, 401, "Invalid email or password");
    }
  });
});

//  Delete User
app.delete("/api/v1/users/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM users WHERE id = $1";

  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting user:", err);
      return responseAPI(res, false, 500, "Failed to delete users");
    }
    responseData(res, result);
  });
});

// Save Messages
app.post("/api/v1/messages", (req, res) => {
  const { userId, sender, textMessage } = req.body;
  const sql = "INSERT INTO messages (user_id, sender, text_message) VALUES ($1, $2, $3) RETURNING *";
  const values = [userId, sender, textMessage];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error saving message:", err);
      return responseAPI(res, false, 500, "Failed to save messages");
    }
    return responseData(res, result.rows[0]);
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
