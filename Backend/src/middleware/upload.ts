import multer from "multer";
const storage=multer.memoryStorage();

const upload=multer({
    storage:storage,
    limits:{
        fileSize:10*1024*1024 
    },

    fileFilter:(req,file,cb)=>{
        console.log("File type:", file.mimetype);
        console.log("File name:", file.originalname);

        if ( file.mimetype === "application/pdf" ||
            file.mimetype === "text/csv" ||
            file.mimetype === "application/vnd.ms-excel" ||
            file.mimetype === "application/octet-stream") {
            cb(null, true);
        } else {
           cb(new Error("Only PDF and CSV files are allowed"));
        }

    }


})



export default upload;