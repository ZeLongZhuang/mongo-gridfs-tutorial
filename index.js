const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const methodOverride = require('method-override');
const fs = require('fs');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Mongo URI
const mongoURI = 'mongodb://localhost/mongodb-gridfs';

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);

// Init gfs
let gridfsBucket;

conn.once('open', () => {
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
    });
});

// Create storage engine using crypto module
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});

const upload = multer( { storage });

// @route GET /
// @desc Loads from
app.get('/', (req, res) => {
    gridfsBucket.find().toArray((err, files) => {
        // Check if files exist
        if (!files || files.length == 0) {
            res.render('index', {files: false});
        } else {
            files.map(file => {
                if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
                    file.isImage = true;
                    file.isPDF = false;
                    file.isWord = false;
                } else if (file.contentType === 'application/pdf') {
                    file.isPDF = true;
                    file.isImage = false;
                    file.isWord = false;
                } else if (file.contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    file.isPDF = false;
                    file.isImage = false;
                    file.isWord = true;
                }
            });
            res.render('index', {files: files});
        }
    });
});

// @route POST /upload
// @desc Uploads file to db
app.post('/upload', upload.single('file'), (req, res) => {
    res.redirect('/');
});

// @route GET /files
// @desc Display all files in JSON
app.get('/files', (req, res) => {
    gridfsBucket.find().toArray((err, files) => {
        // Check if files exist
        if (!files || files.length == 0) {
            return res.status(404).json({
                err: 'No files exist'
            });
        }

        // Files exist
        return res.json(files);
    })
});

// @route GET /files/:filename
// @desc Display a file in JSON
app.get('/files/:filename', (req, res) => {
    gridfsBucket.find({filename: req.params.filename}).toArray((err, file) => {
        // Check if files exist
        if(!file || file.length == 0) {
            return res.status(404).json({
                err: 'No file exist'
            });
        }
        // Files exist
        return res.json(file);
    });
});

// @route GET /document/:filename
// @desc Display document
app.get('/document/:filename', (req, res) => {
    gridfsBucket.find({filename: req.params.filename}).toArray((err, file) => {
        // Check if files exist
        if (!file || file.length == 0) {
            return res.status(404).json({
                err: 'No file exist'
            });
        }
        // Check if document
        if (file[0].contentType === 'application/pdf' || file[0].contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Read output to browser
            const readstream = gridfsBucket.openDownloadStream(file[0]._id);
            readstream.pipe(res);
        } else {
            res.status(404).json({
                err: 'Not a document'
            });
        }
    });
});

// @route GET /image/:filename
// @desc Display image
app.get('/image/:filename', (req, res) => {
    gridfsBucket.find({filename: req.params.filename}).toArray((err, file) => {
        // Check if files exist
        if (!file || file.length == 0) {
            return res.status(404).json({
                err: 'No file exist'
            });
        }
        // Check if image
        if (file[0].contentType === 'image/jpeg' || file[0].contentType === 'image/png') {
            // Read output to browser
            const readstream = gridfsBucket.openDownloadStream(file[0]._id);
            readstream.pipe(res);
        } else {
            res.status(404).json({
                err: 'Not an image'
            });
        }
    });
});

// @route GET /download/:fileid
// @desc Download file
app.get('/download/:fileid', (req, res) => {

    const fileid = (req.params.fileid).toString();
    console.log(fileid);

    const cursor = gridfsBucket.find({_id: mongoose.Types.ObjectId(fileid)});

    cursor.forEach((doc, err) => {
        if (err) {
            console.log(err);
        }
        console.log(doc);

        const downStream = gridfsBucket.openDownloadStreamByName(doc.filename);

        res.setHeader('Content-Type', doc.contentType);
        res.setHeader('Content-Disposition', `attachment; filename=${doc.filename}`);

        downStream.pipe(res);
    })
});

// @route DELETE /files/:filename
// @desc Delete file
app.delete('/files/:id', (req, res) => {
    const obj_id = mongoose.Types.ObjectId(req.params.id);
    gridfsBucket.delete(obj_id);
    res.redirect('/');
});

const port = 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));