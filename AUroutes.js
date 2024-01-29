const express = require("express");
const app = express();

app.use(express.json());

// same as todo list but here we have to maintain admin user and courses respectively.
let ADMINS = [];
let USERS = [];
let COURSES = [];

// check whether the admin is tryiong to login has an account or not
const adminAuthentication = (req, res, next) => {
  const { username, password } = req.headers;
  //   console.log(username);
  //   console.log(password); // is liye likhna pada because header me 's' nhu tha
  //   console.log(ADMINS);

  const admin = ADMINS.find(
    (i) => i.username === username && i.password === password
  );
  if (admin) {
    // console.log("matched");
    next();
  } else {
    res.send(403).json({ message: "admin does not exists" });
  }
};

// check whether user exist or not  then only allow to use resourse/courses
const userAuthentication = (req, res, next) => {
  const { username, password } = req.headers;
  const user = USERS.find(
    (i) => i.username === username && i.password === password
  );
  if (user) {
    //?? nhi samjh aaya
    req.user = user; //add object to request for next middleware

    next();
  } else {
    res.status(403).json({ message: "user does not exists" });
  }
};
// Admin routes
app.post("/admin/signup", (req, res) => {
  // logic to sign up admin
  const admin = req.body; // amin={username:"atul",password:"1234"}
  const existingadmin = ADMINS.find((i) => i.username === admin.username);
  if (existingadmin) {
    res.status(403).json({ message: "Admin already exists" });
  } else {
    ADMINS.push(admin);
    console.log(admin);
    res.json({ message: "Admin created succesfully" });
  }
});

app.post("/admin/login", adminAuthentication, (req, res) => {
  // logic to log in admin
  res.json({ message: "logged in succesfully" });
});

//var cnt = 0;
app.post("/admin/courses", (req, res) => {
  // logic to create a course
  const course = req.body;
  // or cnt++; then corse=cnt;

  course.id = Date.now(); // used timestamp as id
  COURSES.push(course);
  res.status(201).json({ message: "course created succesfully" });
});

app.put("/admin/courses/:courseId", (req, res) => {
  // logic to edit a course
  const courseId = parseInt(req.params.courseId);
  // id jo cahiye usko courses array me check krna  hai.
  const course = COURSES.find((item) => item.id == courseId);
  if (course) {
    Object.assign(course, req.body);
    // target ,sr for updating and merging
    //?? value assign new req.body.title
    res.json({ message: "Course updated succesfully" });
  } else {
    res.status(404).json({ message: "Course not found" });
  }
});

app.get("/admin/courses", adminAuthentication, (req, res) => {
  // logic to get all courses
  res.json({ courses: COURSES });
  //??
});

// User routes
app.post("/users/signup", (req, res) => {
  // logic to sign up user

  //const user={...req.body,purchasedCourses:[]}

  const user = {
    username: req.body.username,
    password: req.body.password,
    purchasedCourses: [],
  };
  USERS.push(user);
  res.json({ message: "user created succesfully" });
});

app.post("/users/login", userAuthentication, (req, res) => {
  // logic to log in user
  res.json({ message: "loggegd in succesfully" });
});

app.get("/users/courses", (req, res) => {
  // logic to list all courses

  // COURSES.filter(c=>c.pusblished)

  let filteredcourses = [];
  for (let i = 0; i < COURSES.length; i++) {
    if (COURSES[i].published) {
      filteredcourses.push(COURSES[i]);
    }
  }
  res.json({ courses: filteredcourses });
});

app.post("/users/courses/:courseId", userAuthentication, (req, res) => {
  // logic to purchase a course
  const courseId = Number(req.params.courseId);
  const course = COURSES.find((i) => i.id == courseId && i.published);
  if (course) {
    // authenmtication me req.user == user issilye kiyer hai ki jo kharide ga uski ka name me update hoga
    req.user.purchasedCourses.push(course);
    // ?? pusrchased course kaha se aaya ??
    res.json({ message: "course purchased succesfully" });
  } else {
    res.status(403).json({ message: "course not found" });
  }
});

app.get("/users/purchasedCourses", userAuthentication, (req, res) => {
  // logic to view purchased courses
  var pusrchasedCoursesIds = req.user.purchasedCourses;
  // while purchasing we only push the  course id
  // but wile get we want to get full info of course not just id
  // let it has purchased two ids [1,4]; in  above line
  var purchasedCourses = [];
  for (let i = 0; i < COURSES.length; i++) {
    if (pusrchasedCoursesIds.indexOf(COURSES[i].id !== -1)) {
      // give index of course id is present in purchased id
      purchasedCourses.push(COURSES[i]);
    }
  }

  // const purchasedCourses = COURSES.filter(c => req.user.purchasedCourses.includes(c.id));
  // We need to extract the complete course object from COURSES
  // which have ids which are present in req.user.purchasedCourses

  res.json({ purchasedCourses });
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});

// we dont want to send user name password everytime
// so good way is to hash inton a token and send it
// when we signup we get the tokenm and in evry furure request we send the token for authorization
// server know whose token is this
// its non-human  readable
// how can we do that ?

// send in succesive request  input headers as { authorixzation,: bearer jwt_token_here'}
// jason web token only srver can decode it

// encryption vs hashing
//in hashing we has to diff string and cant get back but in encoding we have some pssword or secrety code we can get back to origina
