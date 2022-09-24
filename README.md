# Mongo Gridfs Tutorial

This is a simple code demonstrating basic implementation of Gridfs in uploading and storing files in mongodb. This is an updated version of the tutorial designed by Brad Traversy from Github which can be access through this repo link [Mongo File Uploads](https://github.com/bradtraversy/mongo_file_uploads). His tutorial video can be accessed through this [Youtube link](https://youtu.be/3f5Q9wDePzY). This version completely trashes the use of gridfs-stream module which is now deprecated, and instead implements Mongoose's GridFSBucket.

## Getting Started

### Dependencies

* body-parser
* ejs
* express
* method-override
* mongoose
* multer
* multer-gridfs-storage

### Installing

```
npm install
```

### Executing program

```
npm run dev
```
