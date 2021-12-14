const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "userData.db");
const app = express();
app.use(express.json());
let db = null;

const initializeServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    console.log(`Error has been generated ${e.message}`);

    process.exit(1);
  }
};

initializeServer();

const validatePassword = (password) => {
  return password.length > 4;
};

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const hashPassword = await bcrypt.hash(password, 10);
  const dbUserQuery = `SELECT 
    *
   FROM 
     user
   WHERE
    username = '${username}';`;

  const dbUser = await db.get(dbUserQuery);

  if (dbUser === undefined) {
    const addUserQuery = `
      INSERT INTO 
        user(username, name, password, gender, location)
      VALUES
        ('${username}', '${name}', '${hashPassword}', '${gender}', '${location}');
      `;

    if (validatePassword(password)) {
      await db.run(addUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `SELECT * FROM user WHERE '${username}';`;
  const dbUser = await db.get(userQuery);

  if (dbUser !== undefined) {
    const comparePassword = await bcrypt.compare(password, dbUser.password);
    if (comparePassword === true) {
      response.send("Login Success");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const dbUserQuery = `SELECT * FROM user WHERE username= '${username}';`;
  const dbUser = await db.get(dbUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("User Invalid");
  } else {
    const comparePassword = await bcrypt.compare(oldPassword, dbUser.password);

    if (comparePassword === true) {
      if (validatePassword(newPassword)) {
        const newHashPassword = await bcrypt.hash(newPassword, 10);
        const updatePassword = `
            UPDATE 
              user
            SET 
              password = '${newHashPassword}'
            WHERE 
              username = '${username}';
            `;
        await db.run(updatePassword);
        response.send("Updated password successfully");
      } else {
        response.status(400);
        response.send("Password too short");
      }
    } else {
      response.status(400);
      response.send("Password didn't matches");
    }
  }
});
