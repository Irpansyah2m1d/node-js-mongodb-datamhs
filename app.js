// require express
const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const flash = require('connect-flash')
const methodOverride = require('method-override')
const multer = require('multer')
const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')
const ObjectId = mongoose.Types.ObjectId;
// const {ObjectId} = require('mongodb')


// Hubungkan koneksi ke database dan models
const db = require('./utils/db')
const Mahasiswa = require('./models/Mahasiswa')

const app = express()
const port = 3000;



// Konfigurasi middleware
// 1. set view engine ke ejs
app.use(cookieParser('secret'))
app.use(session({
    cookie: {maxAge: 6000},
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
}))
app.use(flash())
app.set('view engine', 'ejs')
app.use(expressLayouts)
app.use(express.static('public'))
// app.use(express.static('img'))
app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))

app.use((req, res, next) => {
    res.locals.active = req.path;
    res.locals.navbar = path.join(__dirname, 'views/layouts', 'nav.ejs');
    next();
  });
// Halaman home
app.get('/', (req, res) => {
    res.render('index', {title: "Halaman Home", layout: './layouts/main-layout'})
})



// Halaman Data Mahasiswa
app.get('/data-mahasiswa', async (req, res) => {
    // console.log(req.path)
    const dataMahasiswa = await Mahasiswa.find()
    // console.log(dataMahasiswa)
    const msg = req.flash('msg')
    // console.log(msg)
    res.render('data-mahasiswa', {title: "Data Mahasiswa", layout: './layouts/main-layout', mahasiswa: dataMahasiswa, msg })
})

// Konfigurasi penyimpanan upload file

const storage = multer.diskStorage({
    destination: (req, foto, cb) => {
        cb(null, './public/img/upload_file/');
    },
    filename: (req, foto, cb) => {
        cb(null, Date.now() + '-' + foto.originalname);
    }
})

const upload = multer({storage: storage})
// Halaman Tambah Data Mahasiswa
app.get('/add-mahasiswa', (req, res) => {
    res.render('add-mahasiswa', {title: "Tambah Data Mahasiswa", layout: './layouts/main-layout'})
})

// Proses tambah data mahasiswa
app.post('/mahasiswa', upload.single('foto'), (req, res) => {
    // const newFile = new Mahasiswa({ foto: req.file.filename });
    // console.log(req.file.filename)
    req.body.foto = req.file.filename
    // res.send(req.body)

    Mahasiswa.insertMany(req.body).then(() => {
        req.flash('msg', 'Data Berhasil di Tambahkan')
        res.redirect('/data-mahasiswa')
    })
})

// Proses Hapus Data Mahasiswa
app.delete('/mahasiswa', async (req, res) => {
    // res.send(req.body.id)
    const data = await Mahasiswa.findById(req.body.id)
//    res.send(data.foto)

    Mahasiswa.deleteOne({_id: new ObjectId(req.body.id)}).then(() => {
        fs.unlinkSync(`./public/img/upload_file/${data.foto}`)
        req.flash('msg', 'Data Berhasil Dihapus')
        // console.log("Data berhasil dihapus!")
        res.redirect('/data-mahasiswa')
    }).catch((err) => {
        console.log(err)
    })
})

// Proses edit data mahasiswa
app.get('/mahasiswa/edit/:id', async (req, res) => {
    const mahasiswa = await Mahasiswa.findOne({_id: new ObjectId(req.params.id)})
    // res.sedn(mahasiswa)
    res.render('edit-mahasiswa', {title: "Edit Data Mahasiswa", layout: 'layouts/main-layout', mahasiswa})
})

app.put('/mahasiswa', upload.single('foto'),  (req, res) => {
    const filterId = {_id : new ObjectId(req.body.id)}
    delete req.body.id;
    if(req.file){
        fs.unlinkSync(`./public/img/upload_file/${req.body.fotoLama}`)
        upload.single('foto')
        req.body.foto = req.file.filename
    }else{
        req.body.foto = req.body.fotoLama;
    }
//    res.send(req.body)
    Mahasiswa.updateOne(filterId, {
        $set: req.body
    }).then(() => {
        req.flash('msg', 'Data Berhasil Diubah')
        res.redirect('/data-mahasiswa')
    })
} )

app.listen(port, () => {
    console.log(`Server is listening on port ${port}... http://localhost:${port}`)

})