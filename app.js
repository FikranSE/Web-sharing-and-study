const fs = require('fs');
const express = require('express')
const mysql = require('mysql2')
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path=require('path');
const moment = require('moment');
const multer = require('multer');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash')

const app = express()
const port = 3000;



//buat folder penampung file jika tidak ada
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// middleware untuk parsing request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());


app.set('views', path.join(__dirname, '/views'));

app.use('/css', express.static(path.resolve(__dirname, "assets/css")));
app.use('/img', express.static(path.resolve(__dirname, "assets/img")));
app.use('/submission', express.static('/img'));

// template engine
app.set('view engine', 'ejs')

// layout ejs
app.use(expressLayouts);

// mengatur folder views
app.set('views', './views');
// Middleware session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Middleware flash messages
app.use(flash());

// Create multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Create multer upload configuration
const upload = multer({ storage: storage });


const saltRounds = 10;



// Konfigurasi koneksi ke database
const db = mysql.createConnection({
  host: 'localhost', 
  user: 'root',
  password: '',
  database: 'webppsi' 
});

db.connect((err) => {
  if (err) {
    console.error('Gagal terkoneksi ke database:', err);
  } else {
    console.log('Terhubung ke database MySQL');
  }
});



//register dan login
app.get('/register', function (req, res) {
  const errorMessage = req.session.errorMessage;
  req.session.errorMessage = ''; // Clear the error message from session
  const successMessage = req.session.successMessage;
  req.session.successMessage = '';
  res.render('register',{
    title:'Register',
    layout:'layouts/auth-layout',
    errorMessage : errorMessage,
    successMessage : successMessage
  });
})

app.post('/register', function (req, res) {
  const { email, username, password, confirm_password } = req.body;

  // check if username already exists
  const sqlCheck = 'SELECT * FROM users WHERE username = ?';
  db.query(sqlCheck, username, (err, result) => {
    if (err) throw err;
      console.log("tes");
    if (result.length > 0) {
      console.error({ message: 'Username sudah terdaftar', err });
      req.session.errorMessage = 'Username sudah terdaftar';
      return res.redirect('/register');
    }

    if (password !== confirm_password) {
      console.error({ message: 'Password tidak cocok!', err });
      req.session.errorMessage = 'Password tidak cocok!';
      return res.redirect('/register');
    }

    // hash password
    bcrypt.hash(password, saltRounds, function(err, hash) {
      if (err) throw err;

      // insert user to database
      const sqlInsert = "INSERT INTO users (email, username, password) VALUES (?, ?, ?)";
      const values = [email, username, hash];
      db.query(sqlInsert, values, (err, result) => {
        if (err) throw err;
        console.log({ message: 'Registrasi berhasil', values });
        res.redirect('/login');
      });
    });
  });
});


// login page
app.get('/login', function (req, res) {
  const errorMessage = req.session.errorMessage;
  req.session.errorMessage = ''; // Clear the error message from session
  const successMessage = req.session.successMessage;
  req.session.successMessage = '';
  res.render('login',{
    title:'Login',
    layout:'layouts/auth-layout',
    errorMessage : errorMessage,
    successMessage : successMessage
  });
})

app.post('/login', function (req, res) {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], function(err, result) {
    if (err) {
      console.error({ message: 'Internal Server Error', err });
      req.session.errorMessage = 'Internal Server Error';
      return res.redirect('/login');
    }
    if (result.length === 0) {
      console.error({ message: 'Username atau Password salah!!', err });
      req.session.errorMessage = 'Username atau Password salah!!';
      return res.redirect('/login');
    }

    const user = result[0];

    // compare password
    bcrypt.compare(password, user.password, function(err, isValid) {
      if (err) {
        console.error({ message: 'Internal Server Error', err });
        req.session.errorMessage = 'Internal Server Error';
        return res.redirect('/login');
      }

      if (!isValid) {
        console.error({ message: 'Username atau Password salah!!', err });
        req.session.errorMessage = 'Username atau Password salah!!';
        return res.redirect('/login');
      }

      // generate token
      const token = jwt.sign({ id_user: user.id_user }, 'secret_key');
      res.cookie('token', token, { httpOnly: true });

      console.log({ message: 'Login Berhasil', user });
      return res.redirect('/projects');
    });
  });
});

// logout
app.get('/logout', function(req, res) {
  res.clearCookie('token');
  res.redirect('/login');
});

// middleware untuk memeriksa apakah user sudah login atau belum
function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    res.redirect('/login');
    return;
  }

  jwt.verify(token, 'secret_key', function(err, decoded) {
    if (err) {
      res.redirect('/login');
      return;
    }

    req.id_user = decoded.id_user;
    next();
  });
}

// index page


////////////////////////////////////////////////////
//                     POST                     //


app.post('/publish', upload.single('uploaded_file'), requireAuth, (req, res) => {
  const { id_categori, title, excerpt, description } = req.body;
  const uploaded_file = req.file.filename;
  const id_user = req.id_user;

  // Check if user has already submitted for the form
  const submissionSql = `SELECT * FROM posts WHERE id_user = ? AND id_categori = ?`;
  const submissionValues = [id_user, id_categori];
  db.query(submissionSql, submissionValues, (err, submissionResult) => {
    if (err) {
      throw err;
    }

    // Insert data to MySQL
    const insertSql = `INSERT INTO posts (id_categori, id_user, title, excerpt, description, uploaded_file) VALUES (?, ?, ?, ?, ?, ?)`;
    const insertValues = [id_categori, id_user, title, excerpt, description, uploaded_file];
    db.query(insertSql, insertValues, (err, result) => {
      if (err) {
        throw err;
      }
      console.log({ message: 'Submission complete!', insertValues });
      res.redirect('/projects');
    });
  });
});


app.get('/post', requireAuth,function (req, res) {
  const categoriSql = 'SELECT * FROM categori';
  db.query(categoriSql, (err, categoriData) => {
    if (err) {
      throw err;
    }

    res.render('post', {
      title: 'Post',
      layout: 'layouts/main-layout',
      categoriData: categoriData  // Include categori data
    });
  });
});


app.get('/edit-post/:id_post', requireAuth,function (req, res) {
  const id_post = req.params.id_post; 
  const categoriSql = 'SELECT * FROM categori';
  const postSql =  `SELECT posts.*, users.username, categori.categori
  FROM posts
  JOIN users ON posts.id_user = users.id_user
  JOIN categori ON posts.id_categori = categori.id_categori
  WHERE posts.id_post = ?
  `;
  db.query(categoriSql, (err, categoriData) => {
    if (err) {
      throw err;
    }
  db.query(postSql, [id_post], (err, results) => {
    if (err) {
      throw err;
    }

    const dataPostEdit = results[0];

    res.render('edit-post', {
      title: 'Edit post',
      layout: 'layouts/main-layout',
      dataPostEdit,
      categoriData
    });
  });
});
});


app.get('/projects', requireAuth, function (req, res) {
  const postSql = `SELECT *
  FROM posts, users
  WHERE posts.id_user = users.id_user AND posts.id_categori = 1
  `;
  const postSql2 = `SELECT *
  FROM posts, users
  WHERE posts.id_user = users.id_user AND posts.id_categori = 2
  `;
  const kuisionerSql = `SELECT *
  FROM kuisioner, users
  WHERE kuisioner.id_user = users.id_user`;

  db.query(postSql, (err, moduls) => {
    if (err) {
      throw err;
    }

    db.query(postSql2, (err, projects) => {
      if (err) {
        throw err;
      }

      db.query(kuisionerSql, (err, kuisioner) => {
        if (err) {
          throw err;
        }
  
        const dataModuls = moduls;
        const dataProjects = projects;
        const dataKuisioner = kuisioner;

        res.render('projects', {
          title: 'Projects',
          layout: 'layouts/main-layout',
          dataModuls: dataModuls,
          dataProjects: dataProjects,
          dataKuisioner: dataKuisioner
        });
      });
    });
  });
});







app.get('/detail/:id_post', requireAuth,function (req, res) {
  const id_post = req.params.id_post;

  const postSql = `SELECT posts.*, users.username
    FROM posts
    JOIN users ON posts.id_user = users.id_user
    WHERE posts.id_post = ?`;

  db.query(postSql, [id_post], (err, results) => {
    if (err) {
      throw err;
    }

    const detailPost = results[0];

    // Mengambil ukuran berkas
    const fs = require('fs');
    const filePath = 'uploads/' + detailPost.uploaded_file; // Sesuaikan dengan path berkas di server Anda
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInKilobytes = fileSizeInBytes / 1024;

    res.render('detail', {
      title: 'Detail',
      layout: 'layouts/main-layout',
      detailPost: detailPost,
      moment,
      fileSizeInKilobytes: fileSizeInKilobytes.toFixed(2) + ' KB'
    });
  });
});



app.get('/detail-post-user/:id_post', requireAuth,function (req, res) {
  const id_post = req.params.id_post;
  const id_user = req.id_user;

   const postSql = 'SELECT * FROM posts WHERE id_post = ?';
  db.query(postSql, [id_post], function (err, postResult) {
    if (err) throw err;

    const detailPost = postResult[0];

    const userSql = `SELECT * FROM users WHERE id_user = ${id_user}`;

    const fs = require('fs');
    const filePath = 'uploads/' + detailPost.uploaded_file; // Sesuaikan dengan path berkas di server Anda
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInKilobytes = fileSizeInBytes / 1024;


    db.query(userSql, [id_post], function (err, userResult) {
      if (err) throw err;

      res.render('detail-post-user', {
        detailPost: postResult[0],
        userPost: userResult[0],
        moment: moment,
        fileSizeInKilobytes,
        title: 'Detail my post',
        layout: 'layouts/main-layout'
    
     });
    })
  });
});




/////////////////////////////////////////////////////////////////
//                             Download Postingan
////////////////////////////////////////////////////////////////
app.get('/download/:id_user/:id_post', requireAuth, (req, res) => {
  const id_user = req.params.id_user;
  const id_post = req.params.id_post;

  const postSql = 'SELECT * FROM posts WHERE id_post = ?';
  db.query(postSql, [id_post], function(err, postResult) {
    if (err) throw err;
    if (postResult.length === 0) {
      res.status(404).send('post not found');
      return;
    }

    const postSql = 'SELECT * FROM posts WHERE id_user = ? AND id_post = ?';
    db.query(postSql, [id_user, id_post], function(err, postResult) {
      if (err) throw err;
      if (postResult.length === 0) {
        res.status(404).send('post not found');
        return;
      }

      const post = postResult[0];
      const filePath = `uploads/${post.uploaded_file}`;

      res.download(filePath, post.file_name, function(err) {
        if (err) {
          console.log(err);
          res.status(500).send('Internal server error');
        }
      });
    });
  });
});

/////////////////////////////////////////////////////////////////
//                             Edit Post
////////////////////////////////////////////////////////////////
app.post('/edit-post', requireAuth, upload.single('uploaded_file'),  (req, res) => {
  const { id_post, id_categori, title, excerpt, description } = req.body;
  let uploaded_file = null;
  const id_user = req.id_user;

  if (req.file) {
    uploaded_file = req.file.filename;

    // Copy file to img directory
    const source = path.join(__dirname, 'uploads', uploaded_file);
    const destination = path.join(__dirname, 'public', 'img', uploaded_file);
    fs.copyFileSync(source, destination);
  }

  const selectUserSql = `SELECT uploaded_file FROM posts WHERE id_post = ${id_post}`;
  db.query(selectUserSql, (err, result) => {
    if (err) {
      throw err;
    }
    if (!uploaded_file) {
      uploaded_file = result[0].uploaded_file;
    }
  
    // Update data in MySQL
    const updateSql = `UPDATE posts SET title = ?, excerpt = ?, description = ?, uploaded_file = ? WHERE id_user = ?`;
    const updateValues = [title, excerpt, description, uploaded_file, id_user, id_categori];
    db.query(updateSql, updateValues, (err, result) => {
      if (err) {
        throw err;
      }
      console.log({ message: 'Update complete!', updateValues });
      res.redirect('/account');
    });
  });
});






////////////////////////////////////////////////////
//                     POST KUISIONER                    //


app.post('/publish-kuisioner', requireAuth, (req, res) => {
  const { title, excerpt, description } = req.body;
  const id_user = req.id_user;

  // Check if user has already submitted for the post
  const submissionSql = `SELECT * FROM posts WHERE id_user = ?`;
  const submissionValues = [id_user];
  db.query(submissionSql, submissionValues, (err, submissionResult) => {
    if (err) {
      throw err;
    }

    // Insert data to MySQL
    const insertSql = `INSERT INTO kuisioner ( id_user, title, excerpt, description) VALUES (?, ?, ?, ?)`;
    const insertValues = [ id_user, title, excerpt, description];
    db.query(insertSql, insertValues, (err, result) => {
      if (err) {
        throw err;
      }
      console.log({ message: 'Submission complete!', insertValues });
      res.redirect('/projects');
    });
  });
});


app.get('/post-kuisioner', requireAuth, function (req, res) {
  //  data from the 'categori' table
  const categoriSql = 'SELECT * FROM categori';
  db.query(categoriSql, (err, categoriData) => {
    if (err) {
      throw err;
    }

    res.render('post-kuisioner', {
      title: 'Post kuisioner',
      layout: 'layouts/main-layout',
      categoriData: categoriData  // Include categori data
    });
  });
});

app.get('/detail-kuisioner/:id_kuisioner', requireAuth, function (req, res) {
  const id_kuisioner = req.params.id_kuisioner;

  const kuisionerSql = `SELECT kuisioner.*, users.username
  FROM kuisioner
  JOIN users ON kuisioner.id_user = users.id_user
  WHERE kuisioner.id_kuisioner = ?
  `;

  db.query(kuisionerSql, [id_kuisioner], (err, results) => {
    if (err) {
      throw err;
    }

    const detailKuisioner = results[0];

    res.render('detail-kuisioner', {
      title: 'Detail kuisioner',
      layout: 'layouts/main-layout',
      detailKuisioner: detailKuisioner,
      moment:moment
    });
  });
});

app.get('/detail-kuisioner-user/:id_kuisioner', requireAuth, function (req, res) {
  const id_kuisioner = req.params.id_kuisioner;

  const kuisionerSql = `SELECT kuisioner.*, users.username
  FROM kuisioner
  JOIN users ON kuisioner.id_user = users.id_user
  WHERE kuisioner.id_kuisioner = ?
  `;

  db.query(kuisionerSql, [id_kuisioner], (err, results) => {
    if (err) {
      throw err;
    }

    const detailKuisioner = results[0];

    res.render('detail-kuisioner-user', {
      title: 'Detail kuisioner for User',
      layout: 'layouts/main-layout',
      detailKuisioner: detailKuisioner,
      moment:moment
    });
  });
});

app.get('/edit-kuisioner/:id_kuisioner', requireAuth, function (req, res) {
  const id_kuisioner = req.params.id_kuisioner; 
  const kuisionerSql =  `SELECT kuisioner.*, users.username
  FROM kuisioner
  JOIN users ON kuisioner.id_user = users.id_user
  WHERE kuisioner.id_kuisioner = ?
  `;
  db.query(kuisionerSql, [id_kuisioner], (err, results) => {
    if (err) {
      throw err;
    }

    const datakuisioner = results[0];

    res.render('edit-kuisioner', {
      title: 'Edit kuisioner',
      layout: 'layouts/main-layout',
      datakuisioner
    });
  });
});

app.post('/edit-kuisioner', requireAuth, (req, res) => {
  const { title, excerpt, description } = req.body;
  const id_user = req.id_user;

  const updateSql = `UPDATE kuisioner SET title = ?, excerpt = ?, description = ? WHERE id_user = ?`;
  const updateValues = [title, excerpt, description, id_user];
  db.query(updateSql, updateValues, (err, result) => {
    if (err) {
      throw err;
    }
    console.log({ message: 'Update complete!', updateValues });
    res.redirect('/account');
  });
});



app.get('/account', requireAuth, function (req, res) {
  let id_user = req.id_user;
  const selectSql = `SELECT * FROM users WHERE id_user = ${id_user}`;
  const selectPostSql = `SELECT * FROM posts WHERE id_user = ${id_user}`;
  const selectKuisSql = `SELECT * FROM kuisioner WHERE id_user = ${id_user};`;
  db.query(selectSql, (err,resultUser)=>{
    if (err) throw err;
  db.query(selectPostSql, (err,resultPost)=>{
    if (err) throw err;
  db.query(selectKuisSql, (err,resultKuis)=>{
    if (err) throw err;
      res.render('account',{
        user: resultUser[0],
        dataPost: resultPost,
        dataKuis : resultKuis,
        title:'Account',
        layout:'layouts/main-layout'
        })
      })
    })
  })
})

app.get('/edit-account', requireAuth, function (req, res) {
  let id_user = req.id_user;
  const selectUserSql = `SELECT * FROM users WHERE id_user = ${id_user}`;
  db.query(selectUserSql, (err,resultUser)=>{
    if (err) throw err;
      res.render('edit-account',{
        user: resultUser[0],
        title:'edit account',
        layout:'layouts/main-layout'
    })
  })
})

app.post('/post-edit-account', upload.single('avatar'), requireAuth, (req, res) => {
  const id_user = req.id_user;
  const { about, nim } = req.body;
  let avatar = null;

  if (req.file) {
    // Avatar file was uploaded
    avatar = req.file.filename;

    const avatarAllowedExtensions = ['.jpg', '.jpeg', '.png'];
    const avatarExtension = path.extname(req.file.originalname).toLowerCase();

    if (!avatarAllowedExtensions.includes(avatarExtension)) {
      // Delete the invalid file
      fs.unlinkSync(req.file.path);
      res.redirect('/account');
      return;
    }

    // Move the uploaded file to the destination directory
    const avatarSource = path.join(__dirname, 'uploads', avatar);
    const avatarDestination = path.join(__dirname, 'assets', 'img', avatar);
    fs.renameSync(avatarSource, avatarDestination);
  }

  // Build the SQL query dynamically based on whether 'avatar' is provided
  let updateQuery = 'UPDATE users SET about=?, nim=?';
  const values = [about, nim];

  if (avatar) {
    updateQuery += ', avatar=?';
    values.push(avatar);
  }

  updateQuery += ' WHERE id_user=?';
  values.push(id_user);

  // Update data in MySQL
  db.query(updateQuery, values, (err, result) => {
    if (err) {
      console.error(err);
      res.redirect('/account');
      return;
    }
    console.log('Data updated in MySQL!');
    res.redirect('/account');
  });
});



app.get('/about', requireAuth, function (req, res) {
      res.render('about',{
        title:'About',
        layout:'layouts/main-layout'
    })
  })


  app.get('/search', requireAuth, (req, res) => {
    const query = req.query.query; // Ambil query pencarian dari URL parameter "query"
  
    // Lakukan pencarian di tabel "posts"
    const searchPostsSql = `
      SELECT id_post, title, excerpt, avatar, username
      FROM posts
      JOIN users ON posts.id_user = users.id_user
      WHERE title LIKE ? OR excerpt LIKE ?
    `;
  
    // Lakukan pencarian di tabel "kuisioner"
    const searchKuisionerSql = `
      SELECT id_kuisioner AS id_post, title, excerpt, avatar, username
      FROM kuisioner
      JOIN users ON kuisioner.id_user = users.id_user
      WHERE title LIKE ? OR excerpt LIKE ?
    `;
  
    const searchQuery = `%${query}%`; // Mencari kata kunci yang cocok dengan query
  
    // Eksekusi kedua query pencarian secara paralel
    db.query(searchPostsSql, [searchQuery, searchQuery], (err, postsResults) => {
      if (err) {
        throw err;
      }
  
      db.query(searchKuisionerSql, [searchQuery, searchQuery], (err, kuisionerResults) => {
        if (err) {
          throw err;
        }
  
        // Gabungkan hasil pencarian dari kedua tabel
        const searchResults = postsResults.concat(kuisionerResults);
  
        res.render('search-result', {
          title: 'Search Results',
          layout: 'layouts/main-layout',
          results: searchResults,
          query: query,
        });
      });
    });
  });
  



app.listen(port,()=>{
  console.log(`listening on port ${port}`)
})