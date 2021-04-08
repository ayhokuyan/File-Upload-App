
const express = require('express');
const app = express();

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const multer = require('multer');
const methodOverride = require('method-override');

mongoose.connect("mongodb://localhost:27017/images", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})

let imageSchema = new mongoose.Schema({
    imgUrl : String
})

let Picture = mongoose.model('Picture', imageSchema);

app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(methodOverride('_method'));

app.get('/upload', (req, res) => {
    res.render('upload');
})

app.get('/', (req,res) => {
    Picture.find({})
        .then(images => {
            res.render('index', {images : images});
        });
})

// Set image storage
let storage = multer.diskStorage({
    destination : './public/uploads/images/',
    filename : (req, file, cb) => {
        cb(null, file.originalname);
    }
})

// Set multer to upload images
let upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
})

function checkFileType(file, cb){
    const fileTypes = /jpg|jpeg|png|gif/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    if(extName){
        return cb(null, true);
    } else{
        cb('Error, please send images only.');
    }
}

app.post('/uploadSingle', upload.single('singleImage'), (req, res, next) => {
    const file = req.file;
    if(!file){
        return console.log('Please select an image')
    }

    let url = file.path.replace('public', '');

    Picture.findOne({imgUrl: url}) 
        .then(img => {
            if(img){
                console.log('Duplicate image.');
                return res.redirect('/upload');
            }

            Picture.create({imgUrl: url})
                .then(img => {
                    console.log('Image saved to DB');
                    res.redirect('/')
                })
        }) .catch(err => {
            return console.log('ERROR: ' + err);
        })

})

app.post('/uploadMultiple', upload.array('multipleImages'), (req, res, next) => {
    const files = req.files;
    if(!files){
        return console.log('Please select an image')
    }

    files.forEach(file => {
        let url = file.path.replace('public', '');

        Picture.findOne({imgUrl: url}) 
            .then(async img => {
                if(img){
                    return console.log('Duplicate image.');
            }
            await Picture.create({imgUrl: url})
            }) .catch(err => {
                return console.log('ERROR: ' + err);
        })

    }); 

    res.redirect('/')
})


app.delete('/delete/:id', (req, res) => {
    let searchQuery = {_id : req.params.id};

    Picture.findOne(searchQuery).then(img => {
        fs.unlink(__dirname + '/public' + img.imgUrl, (err) => {
            if(err){
                return console.log(err);
            }
            Picture.deleteOne(searchQuery).then(img => {
                res.redirect('/');
            })
        })
    }).catch(err => {
        console.log(err);
    })

})

app.listen(3000,() => {
    console.log('Server started');
})