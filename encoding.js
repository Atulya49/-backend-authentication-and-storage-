const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

const secretKey = "superS3cr3t1"; // replace this with your own secret key

const generateJwt = (user) => {
  const payload = { username: user.username };
  return jwt.sign(payload, secretKey, { expiresIn: "1h" });
  // return after encoding with (original string,key,time) time which we want to set
};

// middleware authentication before the req goes to actual route
const authenticateJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // authoriaztion me we have send Bearer space token extract the token
  if (authHeader) {
    // split kar ke secon part le liye jisse actuasl user name le sake because user name is unique
    const token = authHeader.split(" ")[1];
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      // to use further means for the next middle ware it send the data name of user
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

app.post("/admin/signup", (req, res) => {
  const admin = req.body;
  // during signup he will only  enter his name and password so we need to add other fields by ourself exactly token it will return token after signup
  const existingAdmin = ADMINS.find((a) => a.username === admin.username);
  if (existingAdmin) {
    res.status(403).json({ message: "Admin already exists" });
  } else {
    ADMINS.push(admin);
    const token = generateJwt(admin);
    // generate the token and give in response
    res.json({ message: "Admin created successfully", token });
  }
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.headers;
  const admin = ADMINS.find(
    (a) => a.username === username && a.password === password
  );
  // admin ko main list me find karo
  if (admin) {
    const token = generateJwt(admin);
    res.json({ message: "Logged in successfully", token });
  } else {
    // pahle signup karo babu
    res.status(403).json({ message: "Admin authentication failed" });
  }
});

app.post("/admin/courses", authenticateJwt, (req, res) => {
  const course = req.body; // extract course information
  course.id = COURSES.length + 1; // assign an id to the course
  // confused unique id kasie hai to bhai bata du coursese abhi nill hai phir jaise jasie inc karega it will act like a for loop index
  COURSES.push(course); // add to courses list
  res.json({ message: "Course created successfully", courseId: course.id });
});

app.put("/admin/courses/:courseId", authenticateJwt, (req, res) => {
  const courseId = parseInt(req.params.courseId);

  const courseIndex = COURSES.findIndex((c) => c.id === courseId);
  // find aisa koi cp\ourse exist karta bhi hai ki nhi
  if (courseIndex > -1) {
    const updatedCourse = { ...COURSES[courseIndex], ...req.body };
    // ****//
    //{ ...COURSES[courseIndex] }: This part takes all the properties of the existing course at the specified index (COURSES[courseIndex])
    //and creates a shallow copy of those properties in the updatedCourse object.
    //{ ...req.body }: This part takes all the properties from the request body (req.body) and adds or overrides corresponding properties in the updatedCourse object.
    //**** //
    COURSES[courseIndex] = updatedCourse;
    res.json({ message: "Course updated successfully" });
  } else {
    res.status(404).json({ message: "Course not found" });
  }
});

app.get("/admin/courses", authenticateJwt, (req, res) => {
  res.json({ courses: COURSES });
});

app.post("/users/signup", (req, res) => {
  const user = req.body;
  const existingUser = USERS.find((u) => u.username === user.username);
  if (existingUser) {
    res.status(403).json({ message: "User already exists" });
  } else {
    USERS.push(user);
    const token = generateJwt(user);
    res.json({ message: "User created successfully", token });
  }
});

app.post("/users/login", (req, res) => {
  const { username, password } = req.headers;
  const user = USERS.find(
    (u) => u.username === username && u.password === password
  );
  if (user) {
    const token = generateJwt(user);
    res.json({ message: "Logged in successfully", token });
  } else {
    res.status(403).json({ message: "User authentication failed" });
  }
});

app.get("/users/courses", authenticateJwt, (req, res) => {
  res.json({ courses: COURSES });
});

app.post("/users/courses/:courseId", authenticateJwt, (req, res) => {
  const courseId = parseInt(req.params.courseId);
  const course = COURSES.find((c) => c.id === courseId);
  if (course) {
    const user = USERS.find((u) => u.username === req.user.username);
    // req.user  is set by the jwt middleware
    if (user) {
      if (!user.purchasedCourses) {
        user.purchasedCourses = [];
      }
      user.purchasedCourses.push(course);
      res.json({ message: "Course purchased successfully" });
    } else {
      res.status(403).json({ message: "User not found" });
    }
  } else {
    res.status(404).json({ message: "Course not found" });
  }
});

app.get("/users/purchasedCourses", authenticateJwt, (req, res) => {
  const user = USERS.find((u) => u.username === req.user.username);
  if (user && user.purchasedCourses) {
    // if have a property called purchased course then return all courses of it
    res.json({ purchasedCourses: user.purchasedCourses });
  } else {
    res.status(404).json({ message: "No courses purchased" });
  }
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});

// problem is jwt is same for user and host . We need to make it different for each role of users
// also we want to store the data so that each time the sire regfersh the data is not lost
// we can use file but as we had done in todo but we want to use data base as  MongoDB M stand in MERN
